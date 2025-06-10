import OpenAI from "openai";
import { DoubaoAI } from "@renderer/ai/doubao";
import { get_system_prompt } from "@renderer/prompts/geo-prompt";

// @deprecated 分步骤测试创建线段.
async function test_create_segment() {
  // 辅助函数:
  function _copy(messages: any) {
    return JSON.parse(JSON.stringify(messages));
  }
  function _finish(res: OpenAI.ChatCompletion) {
    return res?.choices?.[0]?.finish_reason ?? '<unk>'
  }
  function _tool_call(res: OpenAI.ChatCompletion) {
    return res?.choices?.[0]?.message?.tool_calls?.[0] ?? null;
  }
  
  console.info('---- test_create_segment() -------------------------------------------------------');
  // 准备对象和数据:
  const ai = new DoubaoAI();
  const systemPrompt = get_system_prompt();
  
  // 本次调用的所有消息列表 (当前进行中的对话消息数组):
  const mainReq = { role: 'user', content: '作线段 AB' };   // 主请求消息
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    mainReq,
  ];

  // >>> LLM 1 : '作线段 AB'
  console.info(`>>> LLM 1: `, _copy(messages));
  const result1 = await ai.create(messages);
  const tool1 = _tool_call(result1);
  const finish1 = _finish(result1);

  console.info(`  Result 1:`, { tool1, finish1: `${finish1}: ${tool1.function.name}`, result1 });
  // 这里期待的 result1 是一个 tool_call: query_point2(AB)
  console.assert(finish1 === 'tool_calls', `expect finish1 = tool_calls, but got ${finish1}`);
  console.assert(tool1.function.name === 'query_point2', `expect tool1.name = query_point2, but got ${tool1?.function?.name}`);

  // 新增: 我们将 LLM 返回的信息也加入到 messages[] 中.
  {
    const assist1 = _copy(result1.choices[0].message);
    messages.push(assist1);
  }

  /* 示例:
    tool1:
      function: {arguments: ' {"name": "AB"}', name: 'query_point2'}
      id: "call_qvuk9jomjfo0ftlpjom0o840"
      type: "function"  
   */
  // 我们假设调用了 query_point2() 函数, 并返回两个点的信息(名字, 坐标等)
  {
    const p1info = { name: 'A', type: 'point', x: -9, y: 2 };
    const p2info = { name: 'B', type: 'point', x: 5, y: 7 };
    const resp = {
      result: 'OK',
      description: `根据名字 AB 找到了点 A, B. 点的详细信息在 points 数组中给出.`,
      points: [p1info, p2info]
    };
    const content = JSON.stringify(resp);
    const tmsg1: OpenAI.ChatCompletionToolMessageParam = {
      role: 'tool',
      content: content,
      tool_call_id: tool1.id,
    };

    messages.push(tmsg1);
  }

  // >>> LLM 2 : '返回 query_point2() 的结果'
  console.info(`>>> LLM 2: `, _copy(messages));
  const result2 = await ai.create(messages); 
  const tool2 = _tool_call(result2);
  const finish2 = _finish(result2);

  console.info(`  Result 2:`, { tool2, finish2: `${finish2}: ${tool2.function.name}`, result2 });
  // 期待 tool-call: create_segment(A,B)
  console.assert(finish2 === 'tool_calls', `expect finish2 = tool_calls, but got ${finish2}`);
  console.assert(tool2.function.name === 'create_segment', `expect tool2.name = create_segment, but got ${tool2?.function?.name}`);
  /* 示例:
    tool2:
      function: {arguments: ' {"A": "A", "B": "B"}', name: 'create_segment'}
      id: "call_q3kvvwbgpsmveqd4kfttgbq1"
      type: "function"
   */
  // 新增: 我们将 LLM 返回的信息也加入到 messages[] 中.
  {
    const assist2 = _copy(result2.choices[0].message);
    messages.push(assist2);
  }

  // 假设调用了 create_segment() 函数, 返回线段的信息.
  {
    const p1info = { name: 'A', type: 'point', x: -9, y: 2 };
    const p2info = { name: 'B', type: 'point', x: 5, y: 7 };
    const resp2 = {
      result: 'OK',
      description: `线段创建成功, 新的线段名字(name)为 a, 两个端点(ends)名为 [A, B].`,
      name: 'a',
      ends: [p1info, p2info],
    };
    const content = JSON.stringify(resp2);
    const tmsg2: OpenAI.ChatCompletionToolMessageParam = {
      role: 'tool',
      content: content,
      tool_call_id: tool2.id,
    };

    messages.push(tmsg2);
  }

  // >>> LLM 3 : '线段创建成功'
  console.info(`>>> LLM 3: `, _copy(messages));
  const result3 = await ai.create(messages);
  const finish3 = _finish(result3);
  console.info(`  Result 3:`, { msg: result3?.choices?.[0]?.message, finish3, result3 });
  // 期待 finish3 = stop
  console.assert(finish3 === 'stop', `expect finish3 = stop, but got ${finish3}`);
  console.info(`AI return: `, result3?.choices?.[0]?.message?.content);

  // 测试成功.
}
