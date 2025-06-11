import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@mui/material";
import OpenAI from "openai";
import type { Board } from "jsxgraph";

import { useMessageWarehouse } from "../store/MessageWarehouseProvider"
import { MessageWarehouse, type MessageItemType } from "../store/MessageWarehouse";
import { useSketchpadStore } from "../store/SketchpadProvider";
import { DoubaoAI } from "../ai/doubao";
import { MessagesList } from "./MessagesList";
import { get_system_prompt } from "../prompts/geo-prompt";
import { ToolCaller } from "./ToolCaller";
import { StepDetail } from "./StepDetail";


export function ChatPane() {
  return (
    <div className="chat-pane pr-2" style={{ marginTop: '-2rem' }}>
      <div className="chat-messages" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        <MessagesList />
      </div>

      <Inputs />
      <TokensUsage />
      <StepDetail />
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
  setSteps: (steps: any[]) => void;
}

// 处理用户输入的函数.
async function process_submit(input: string, { ai, aiStore, board, oldMessages, setMessages, setTokenUsage, setSteps }: PSArgType) {
  // 辅助函数:
  function _copy<T extends any>(messages: T): T {
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

  const start_time = new Date();

  // 开始的系统提示(prompt), 其不需要放在 history message list 中.
  const sysMsg1: OpenAI.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: get_system_prompt(),
  };
  // 主请求消息, 即用户的 input
  const mainMsg: OpenAI.ChatCompletionUserMessageParam = {
    role: 'user',
    content: input,
  };
  const mainMsgId = uuidv4();
  console.info(`mainMsg (${mainMsgId}):`, mainMsg);

  // 当前进行中的对话消息数组:
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    sysMsg1,
    ...oldMessages,   // todo: 这里可能要过滤一下 id 字段, 或换一种存放结构...
    mainMsg,
  ];

  // 当前要显示的 Steps
  const steps: any[] = [input];
  setSteps(steps);

  // 准备好 main-message 之后, 我们即可将其存入 history message .
  const newMsgList = [...oldMessages, { ...mainMsg, id: mainMsgId }];
  setMessages(newMsgList);

  try {
    let lastResult!: OpenAI.ChatCompletion;
  
    // 开发阶段: 限定最多 10 轮调用....
    for (let i = 0; i < 10; i++) {
      // 组装本轮请求的消息列表:
      const elapse = new Date().getTime() - start_time.getTime();
      console.info(`>>> messages(round ${i})(${elapse.toFixed(0)}ms): `, _copy(messages));

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
        const elapse2 = new Date().getTime() - start_time.getTime();
        steps.push(`[${elapse2}ms] 调用结束, 结果:` + result?.choices?.[0]?.message?.content);
        setSteps(_copy(steps));
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

        // 实现调用工具多次.
        let has_time = false;
        for (const tcall of toolCalls) { 
          const name = tcall.function.name;
          const args = tcall.function.arguments;
          const caller = new ToolCaller(aiStore, board);
          const fun_res = await caller.call(name, args ?? "");   // await call_function(name, args);
          const tmsg: OpenAI.ChatCompletionToolMessageParam = {
            role: 'tool',
            content: fun_res,
            tool_call_id: tcall.id,
          };

          const elapse = new Date().getTime() - start_time.getTime();
          if (has_time) {
            steps.push(`* 调用工具 ${name}(${args}) 返回: ${fun_res}`);
          }
          else {
            steps.push(`[${elapse.toFixed(0)}ms] 调用工具 ${name}(${args}) 返回: ${fun_res}`);
          }
          
          has_time = true;
          setSteps(_copy(steps));
          await pause0();  // 暂停一下, 以确保 UI 更新.

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

    // 总计时:
    // const end_time = new Date();
    // const elapse2 = end_time.getTime() - start_time.getTime();
    // steps.push(`调用结束, 总耗时: ${elapse2.toFixed(0)}ms`);
    setSteps(_copy(steps));
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
  const setSteps = useSetAtom(aiStore.steps);
  
  if (!board) return null;

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // @ts-ignore
  const onSubmit2 = async () => {
    const ai = new DoubaoAI();
    process_submit(input.trim(), { ai, aiStore, board: board!, oldMessages, setMessages, setTokenUsage, setSteps });

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

  const clear_history = () => {
    setMessages([]);
    setTokenUsage({ total: 0, prompt: 0, completion: 0 });
    setSteps([]);
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

// 暂停 0ms.
function pause0() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
