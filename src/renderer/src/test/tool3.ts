// 测试 tool 的用法.

import OpenAI from 'openai';
import { DoubaoAI } from '../ai/doubao';


/* 问题:
  LLM 可能不擅长于某种随机数的生成, 并添加到坐标上.
  例如, 当要求 x,y 坐标加上随机数的时候, LLM 给出下面的调用参数, 这不满足我们的要求 (不能进行 JSON 解析, 甚至更复杂的表达式).
     {
        "name": "A",
        "x": 0 + 0.05,
        "y": 0 - 0.03
      }

  这种情况下, 我们该如何解决?
  3. 我们可以在工具函数中, 直接生成随机数, 并返回给 LLM.


*/


// --- 提示词 ---
const sketch_prompt_general = `
你是一个智能助手, 你可以回答用户的问题, 也可以进行一般性的对话.

我们当前工作的环境是一个几何图形/画板的应用, 用户可以看到当前的几何图形, 可以绘制或修改几何图形.
用户可能针对这个几何图形提出问题, 及要求画板上作新的几何元素如点线圆等, 以及问一些基本的数学几何问题.
当前的坐标系是平面直角坐标系, x 值的范围为 (-15, 15), y 值的范围为 (-15, 15).

当用户针对几何图形提问或提出作图要求时, 可使用现有工具获得必要信息, 然后再进行思考回答.

现在我们在原型开发试验阶段, 你如果发现没有足够信息, 可尽量调用工具提供的函数来获取;
如果没有所需要的函数, 可以假设有这么一个函数, 这样可以帮助我们确定应提供什么功能函数.
`;

const sketch_prompt_examples_0 = `
# 操作示例

## 例子 1
如果用户想作线段 A 到 B, 则你可以直接调用工具函数 create_segment('A', 'B') 来实现.

## 例子 2
如果用户想作一条线段 AB, 你首先要推断一下 AB 代表哪两个点, 由于线段有两个端点, 因此这里 A, B 分别表示这两个端点.
  类似的, 线段 A1B2 一般表示 A1 和 B2 这两个点.
如果不能确定是哪两个点, 可以使用工具 split_point2('A1B2') 来确定是哪两个点.

## 例子 3
如果用户想作一条平行线, 则用户需要指定过哪个点, 与哪条线平行. 如 '过点 P 平行于直线 a',
使用工具 create_parallel('P', 'a') 来实现.

用户或表达为 '画一条经过点 Q 且与直线 AB 平行的直线, 
此时使用工具 create_parallel('Q', 'AB') 来实现.

## 例子 4
如果用户想作 角AOB 的角平分线, 其中点O是角的顶点, OA,OB 分别是角的两条边, 此时需要使用工具
 create_bisector('A', 'O', 'B') 来实现.
如果不能确定 AOB 是哪三个点, 可使用工具 split_point3('AOB') 来确定是哪三个点.

## 例子5
如果用户提出删除/去掉/移除 某东西, 但未指出类型, 如说 '删除AB' 而不是说 '删除线段AB', 则告知需要用户给出更明确的类型信息.
`; 

// TEST: 这里加了一个提示: 作三角形时顶点坐标的建议.
const sketch_prompt_tips = `

# Tips

* 操作成功之后, 请尽快停止调用, 给出适合人阅读的提示信息. 如可以不用显示点的坐标, 这通常是内部信息, 除非用户提出要看.
* 如果用户想作一个三角形, 却没有指定点的坐标, 如 '作三角形 ABC', 此时可调用工具得到更详细的提示信息, 然后继续.
* 在获得新的提示信息后, 请继续调用作图函数, 直到完成任务为止.

`;
// * 为了方便测试, 请每一轮回复都包含 message.
// * 如果有 function tool 调用, 尽量每轮回复只有一个调用.




// 由三个部分组成, 或许以后更多部分, 或新的结构.
const sketch_prompt =
  sketch_prompt_general +
  sketch_prompt_examples_0 +
  sketch_prompt_tips;

// --- 工具 ---

const create_point: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_point',
    description: '在给定的位置创建一个(自由)点.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '点的名字'
        },
        x: {
          type: 'number',
          description: '点的 x 坐标'
        },
        y: {
          type: 'number',
          description: '点的 y 坐标'
        }
      },
      required: ['x', 'y']
    },
  }
};

const create_segment: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_segment',
    description: '使用给定的两个端点创建线段',
    parameters: {
      type: 'object',
      properties: {
        A: {
          type: 'string',
          description: '线段的一个端点'
        },
        B: {
          type: 'string',
          description: '线段的另一个端点'
        }
      },
      required: ['A', 'B']
    }
  }
};

const triangle_prompt: OpenAI.ChatCompletionTool = { 
  type: 'function',
  function: {
    name: 'triangle_prompt',
    description: '当用户想作一个三角形, 但没有给出具体的点坐标时, 使用此工具获取提示信息.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

// 获得某些图形的详细提示信息
const detail_prompts: OpenAI.ChatCompletionTool = { 
  type: 'function',
  function: {
    name: 'detail_prompts',
    description: `当用户想作 '三角形(triangle)' 时, 但没有给出具体的点坐标时, 使用此工具获取详细提示信息. ` +
      `然后请根据此提示信息, 继续作图.`,
    parameters: {
      type: 'object',
      properties: {
        shape: {
          type: 'string',
          description: '需要提示的图形名称, 如 "triangle", "circle", "rect", "square" 等.'
        }
      },
      required: [ 'shape' ]
    }
  }
};

const my_tools: OpenAI.ChatCompletionTool[] = [
  create_point,
  create_segment,

  // triangle_prompt,
  detail_prompts
];


// --- 工具的执行与模拟画板 --- 
class SketchBoard {

  public execute_tool(tool_call: OpenAI.ChatCompletionMessageToolCall): any {
    const args = JSON.parse(tool_call.function.arguments);
    console.info('execute_tool:', { function: tool_call.function.name, args });

    switch (tool_call.function.name) {
      case 'create_point':
        return this._create_point(args);
      case 'create_segment':
        return this._create_segment(args);
      // case 'triangle_prompt':
      //   return this._triangle_prompt(args);
      case 'detail_prompts':
        return this._detail_prompts(args);
    }
    return '执行成功.';
  }

  private _create_point(args: { name: string, x: number, y: number }): string {
    // 模拟创建点
    console.info(`创建点 ${args.name} 在 (${args.x}, ${args.y})`);
    return `点 ${args.name} 已创建在 (${args.x}, ${args.y})`;
  }

  private _create_segment(args: { A: string, B: string }): string {
    // 模拟创建线段
    console.info(`创建线段 ${args.A} 到 ${args.B}`);
    return `线段 ${args.A}${args.B} 已创建`;
  }

  private _triangle_prompt(_: any): string {
    // 模拟获取三角形提示信息
    console.info('获取三角形提示信息');
    return `建议创建的三角形坐标的三个点位于 (0,0), (10,0), (4,7) 附近, 在每个坐标 x,y 处随机加一个 -0.1 ~ 0.1 之间的小数字.`;
  }

  /*
    当要求 x,y 坐标加上随机数的时候, LLM 给出下面的调用参数, 这不满足我们的要求.
    " {
            "name": "A",
            "x": 0 + 0.05,
            "y": 0 - 0.03
        }
    }]"  
   */
  private _detail_prompts(args: { shape: string }): string {
    // const r3 = () => rnd3(-0.1, 0.1); // 生成一个 -0.1 ~ 0.1 之间的随机数

    // 模拟获取详细提示信息
    console.info(`获取 ${args.shape} 的详细提示信息`);
    if (args.shape === 'triangle') {

      const pts = SketchBoard.tri_points.map(pp => {
        const pn = (i: number) => +((pp[i] + rnd3(-0.1, 0.1)).toFixed(3));
        return `* (${pn(0)}, ${pn(1)}), (${pn(2)}, ${pn(3)}), (${pn(4)}, ${pn(5)}) .`;
      }).join('\n');
      
      const str = `建议使用以下推荐的坐标点来创建三角形, 请随机选择其中的一组:\n\n` +
        `${pts}` +
        `\n`;
      
      return str;
    }

    return `没有 ${args.shape} 的提示信息.`;
  }

  public static readonly tri_points = [
    // [0, 0, 10, 0, 4, 7],
    [-4.51, 9.20, -8.53, -6.41, 16.04, -6.43],  // 三角形三个顶点的坐标.
    [4.77, 8.72, -5.87, -3.37, 11.77, -3.64],
  ];

}

// 生成一个指定范围内的随机数, 只保留3位有效数字. 
function rnd3(min: number, max: number) {
  const num = Math.random() * (max - min) + min;
  return Math.round(num * 1000) / 1000; // 保留3位有效数字
}

// --- 测试 ---
function _copy<T extends any>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function _reason(resp: OpenAI.Chat.Completions.ChatCompletion) {
  return resp?.choices?.[0]?.finish_reason ?? '';
}

// 向 LLM 提出要求做一个三角形.
export async function _test_tool1() {
  console.info('--- _test_tool1 --------------------------------');
  const board = new SketchBoard();

  const ai = new DoubaoAI();
  ai._tools = my_tools;

  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  messages.push({ role: 'system', content: sketch_prompt });   // 豆包现在不支持 role=developer

  // 1. '作三角形 ABC'
  const user1: OpenAI.ChatCompletionMessageParam = { role: 'user', content: '作三角形 PQR' };
  messages.push(user1);
  const response1 = await ai.create(messages);
  console.info('step-1:', { messages: _copy(messages), response: response1 });

  let last_resp: typeof response1 = response1;
  const ai_msg = _copy(last_resp.choices[0].message);
  messages.push(ai_msg);

  // 2. 看 LLM 返回的什么.(一般含 function-tool call)
  for (let i = 0; i < 20 && _reason(last_resp) !== 'stop'; i++) {
    // 期待 reason 是 'tool_calls'
    if (_reason(last_resp) !== 'tool_calls') {
      throw new Error(`expect reason is 'tool_calls', but got ${_reason(last_resp)}`);
    }

    // // 期待 tool_call 只有一个
    // if (last_resp.choices[0].message.tool_calls.length !== 1) {
    //   throw new Error(`expect tool_calls length is 1, but got ${last_resp.choices[0].message.tool_calls.length}`);
    // }

    // 尽管我已经要求一次只调用一个工具, 但是 LLM 仍然会返回多个工具调用, 所以我们实现多个工具调用吧.
    const toolCalls = last_resp.choices[0].message.tool_calls!;
    for (const tcall of toolCalls) { 
      //const name = tcall.function.name;
      //const args = tcall.function.arguments;
      const fun_res = await board.execute_tool(tcall);
      const tmsg: OpenAI.ChatCompletionToolMessageParam = {
        role: 'tool',
        content: fun_res,
        tool_call_id: tcall.id,
      };

      messages.push(tmsg);
    }

    // 再次请求 LLM 
    last_resp = await ai.create(messages);
    console.info(`step-${i + 2}:`, { messages: _copy(messages), response: last_resp });
    
    const ai_msg = _copy(last_resp.choices[0].message);
    messages.push(ai_msg);
  }

  console.info('last_resp:', { messages: _copy(messages), response: last_resp });
}
