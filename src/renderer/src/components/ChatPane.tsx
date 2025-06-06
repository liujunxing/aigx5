import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@mui/material";
import type {
  ChatCompletionMessageParam, 
  ChatCompletionUserMessageParam, 
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  // @ts-ignore unused ....
  ChatCompletionAssistantMessageParam,
  ChatCompletion
} from "openai/resources/chat/completions/completions.mjs";
import type { Board } from "jsxgraph";

import { useMessageWarehouse } from "../store/MessageWarehouseProvider"
import { MessageWarehouse, type MessageItemType } from "../store/MessageWarehouse";
import { useSketchpadStore } from "../store/SketchpadProvider";
import { DoubaoAI } from "../ai/doubao";
import { MessagesList } from "./MessagesList";
import { get_system_prompt } from "../prompts/geo-prompt";
import { ToolCaller } from "./ToolCaller";


export function ChatPane() {
  // const store = useJxgStore();
  // console.info(`store in ChatPane: `, store); 
  
  return (
    <div className="chat-pane pr-2">
      <h2>Chat</h2>
      <div className="chat-messages" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        <MessagesList />
      </div>

      <Inputs />
      <TokensUsage />
    </div>
  )
}

type PSArgType = {
  ai: DoubaoAI;
  aiStore: MessageWarehouse;
  board: Board; 
  oldMessages: any[];
  setMessages: (_: MessageItemType[]) => void;
  setTokenUsage: (usage: any) => void;
}

// 处理用户输入的函数.
async function process_submit(input: string, { ai, aiStore, board, oldMessages, setMessages, setTokenUsage }: PSArgType) {
  // 辅助函数:
  function _copy(messages: any) {
    return JSON.parse(JSON.stringify(messages));
  }

  // 统计信息:
  const usage: MessageWarehouse.TokensUsage = {
    total: 0,
    prompt: 0,
    completion: 0,
  };

  console.info('---------------------------------------------------------------------------');
  console.info(`process_submit(): `, { input, ai, aiStore, oldMessages });
  if (!input) return;

  // 开始的系统提示(prompt), 其不需要放在 history message list 中.
  const sysMsg1: ChatCompletionSystemMessageParam = {
    role: 'system',
    content: get_system_prompt(),
  };
  // 主请求消息, 即用户的 input
  const mainMsg: ChatCompletionUserMessageParam = {
    role: 'user',
    content: input,
  };
  const mainMsgId = uuidv4();
  console.info(`mainMsg (${mainMsgId}):`, mainMsg);

  // 当前进行中的对话消息数组:
  const messages: ChatCompletionMessageParam[] = [
    sysMsg1,
    ...oldMessages,   // todo: 这里可能要过滤一下 id 字段, 或换一种存放结构...
    mainMsg,
  ];

  // 准备好 main-message 之后, 我们即可将其存入 history message .
  const newMsgList = [...oldMessages, { ...mainMsg, id: mainMsgId }];
  setMessages(newMsgList);

  try {
    let lastResult!: ChatCompletion & {
      _request_id?: string | null;
    };
  
    // 开发阶段: 限定最多 5 轮调用....
    for (let i = 0; i < 5; i++) {
      // 组装本轮请求的消息列表:
      console.info(`>>> messages(round ${i}): `, _copy(messages));

      const result = await ai.create(messages);
      lastResult = result;
      console.info(`  Result (${i}): `, result);

      // 更新 tokens 使用信息.
      usage.total += result.usage.total_tokens;
      usage.prompt += result.usage.prompt_tokens;
      usage.completion += result.usage.completion_tokens;
      setTokenUsage(_copy(usage));

      const finishReason = result?.choices[0]?.finish_reason;
      if (finishReason === 'stop') {
        break;
      }
    
      // 对于 tool_calls 我们可以处理:
      if (finishReason === 'tool_calls') {
        // 将 LLM 返回的 tool-call 消息也添加进去, 以确保消息的完整性.
        const assist1 = _copy(result.choices[0].message);
        messages.push(assist1);

        // 执行工具调用.
        const toolCalls = result.choices[0].message.tool_calls!;
        // console.info(`  tool_calls: `, toolCalls);
        if (!toolCalls?.length) {
          console.error(`tool_calls is empty.`);
          return;
        }

        // 现在先简化问题, 只支持单个 tool call...
        // if (toolCalls.length > 1) { 
        //   throw new Error(`当前只支持一次调用一个 tool. 而 tool_calls.length = ${toolCalls.length} .`);
        // }
        // const tcall0 = toolCalls[0];
        
        // 实现调用工具多次.
        for (const tcall of toolCalls) { 
          const name = tcall.function.name;
          const args = tcall.function.arguments;
          const caller = new ToolCaller(aiStore, board);
          const fun_res = await caller.call(name, args || "");   // await call_function(name, args);
          const tmsg: ChatCompletionToolMessageParam = {
            role: 'tool',
            content: fun_res,
            tool_call_id: tcall.id,
          };

          messages.push(tmsg);
        }

        // 进行下一轮调用.
        continue;
      }
      else {
        console.error(`Unsupported finish reason: ${finishReason}`);
        return;
      }
    }

    // 后续处理.
    console.info(`post-handle, lastResult: `, lastResult);

    // 当我们完成调用后, 可以只保存部分信息.
    const lastMsg = {
      role: lastResult.choices[0].message.role,
      content: lastResult.choices[0].message.content,
      id: lastResult.id,
    };
    setMessages([...newMsgList, lastMsg]);
    setTokenUsage(_copy(usage));
  }
  catch (err) {
    console.error('exception: ', err);
    // 已知可能有 PermissionDeniedError: 403 The request failed because your account has an overdue balance.

    const errMsg = {
      role: 'system',
      content: `发生错误, ${err?.message ?? '未知错误'}`,
      id: uuidv4()
    };
    setMessages([...newMsgList, errMsg]);
  }
}


function Inputs() {
  const { board } = useSketchpadStore();
  const aiStore = useMessageWarehouse();
  // const [ai] = useState(() => new DoubaoAI());

  const [input, setInput] = useState('');
  const [oldMessages, setMessages] = useAtom(aiStore.messages);
  const setTokenUsage = useSetAtom(aiStore.tokensUsage);
  
  if (!board) return null;

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // @ts-ignore
  const onSubmit2 = async () => {
    const ai = new DoubaoAI();
    process_submit(input.trim(), { ai, aiStore, board: board!, oldMessages, setMessages, setTokenUsage });

    setInput('');  // 清空输入框
    // todo: setMessages(...)
  };

  // @ts-ignore
  const onSubmit = async () => {
    const ai = new DoubaoAI();
    
    // console.info(`todo: onSubmit() `, { input });
    const lastItem = {
      role: 'user',
      content: input,
      id: `user-${+new Date()}-${Math.random().toString().replace('.', '')}`,
    };

    setInput('');  // 清空输入框

    const messages = [
      ...oldMessages.filter(msg => msg.role === 'user'),  // 仅保留用户消息, 这样可行吗?
      lastItem
    ];
    console.info(`submit: `, JSON.parse(JSON.stringify(messages)));

    setMessages(prev => [...prev, lastItem]);

    const result = await ai.create(messages);
    const text = result?.choices[0]?.message?.content ?? '';
    console.info(`result: `, { text, result, messages });

    const response = {
      role: 'assistant', content: text,
      id: result.id,
    };
    setMessages(prev => [...prev, response]);
  };

  // @ts-ignore
  const segment_click = () => {
    test_create_segment();
  };

  const clear_history = () => {
    setMessages([]);
    setTokenUsage({ total: 0, prompt: 0, completion: 0 });
  };

  return (
    <div>
      <input type="text" size={60} placeholder="message ..." value={input} onChange={onInputChange} style={{ border: '1px solid gray'}} />
      {/* <button className="reset-button" onClick={onSubmit}>Submit</button> */}
      <Button variant="outlined" onClick={onSubmit2}>Send</Button>
      <Button variant="outlined" title="清除历史消息, 可以减少使用的 tokens 量" onClick={clear_history}>清除历史消息</Button>
      {/* <Button variant="outlined" onClick={segment_click}>Test Segment</Button> */}
    </div>
  )
}

function TokensUsage() {
  const aiStore = useMessageWarehouse();
  const usage = useAtomValue(aiStore.tokensUsage);
  
  return (
    <div className="text-right text-sm text-gray-600 pr-4">
      total: {usage.total}, prompt: {usage.prompt}, completion: {usage.completion}
      &nbsp;(本次 tokens 使用情况)
    </div>
  )
}


// @deprecated 分步骤测试创建线段.
async function test_create_segment() {
  // 辅助函数:
  function _copy(messages: any) {
    return JSON.parse(JSON.stringify(messages));
  }
  function _finish(res: ChatCompletion) {
    return res?.choices?.[0]?.finish_reason ?? '<unk>'
  }
  function _tool_call(res: ChatCompletion) {
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
    const tmsg1: ChatCompletionToolMessageParam = {
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
    const tmsg2: ChatCompletionToolMessageParam = {
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
