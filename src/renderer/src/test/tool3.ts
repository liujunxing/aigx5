// 测试 tool 的用法.

import OpenAI from 'openai';
import { DoubaoAI } from '../ai/doubao';



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

* 为了方便测试, 请每一轮回复都包含 message.
* 如果有 function tool 调用, 尽量每轮回复只有一个调用.
* 操作成功之后, 请尽快停止调用, 给出适合人阅读的提示信息. 如可以不用显示点的坐标, 这通常是内部信息, 除非用户提出要看.
* 如果用户想作一个三角形, 却没有指定点的坐标, 如 '作三角形 ABC', 此时可调用工具得到更详细的提示信息, 然后继续.

`;




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

const my_tools: OpenAI.ChatCompletionTool[] = [
  create_point,
  create_segment,

  triangle_prompt,
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
      case 'triangle_prompt':
        return this._triangle_prompt(args);
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
  const user1: OpenAI.ChatCompletionMessageParam = { role: 'user', content: '作三角形 ABC' };
  messages.push(user1);
  const response1 = await ai.create(messages);
  console.info('round-1:', { messages: _copy(messages), response: response1 });

  let last_resp: typeof response1 = response1;
  const ai_msg = _copy(last_resp.choices[0].message);
  messages.push(ai_msg);

  // 2. 看 LLM 返回的什么.(一般含 function-tool call)
  for (let i = 0; i < 20 && _reason(last_resp) !== 'stop'; i++) {
    // 期待 reason 是 'tool_calls'
    if (_reason(last_resp) !== 'tool_calls') {
      throw new Error(`expect reason is 'tool_calls', but got ${_reason(last_resp)}`);
    }

    // 期待 tool_call 只有一个
    if (last_resp.choices[0].message.tool_calls.length !== 1) {
      throw new Error(`expect tool_calls length is 1, but got ${last_resp.choices[0].message.tool_calls.length}`);
    }

    // 执行工具调用:
    const tool_call = last_resp.choices[0].message.tool_calls[0];
    const fun_res = board.execute_tool(tool_call);


    const tmsg: OpenAI.ChatCompletionToolMessageParam = {
      role: 'tool',
      content: fun_res,
      tool_call_id: tool_call.id,
    };
    messages.push(tmsg);

    // 再次请求 LLM 
    last_resp = await ai.create(messages);
    console.info(`round-${i + 2}:`, { messages: _copy(messages), response: last_resp });
    
    const ai_msg = _copy(last_resp.choices[0].message);
    messages.push(ai_msg);
  }

  console.info('last_resp:', { messages: _copy(messages), response: last_resp });
}
