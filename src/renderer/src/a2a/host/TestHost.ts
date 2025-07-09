// 测试 host-agent 功能.

import OpenAI from 'openai';
import { v4 as uuidv4 } from "uuid";
import { SimpleAI } from '@renderer/ai/SimpleAI';
import { Message, MessageSendParams, SendMessageSuccessResponse, TextPart } from '@a2a-js/sdk';
import { A2AClient } from "@a2a-js/sdk/build/src/client/client.js";

function get_prompt() {
  const prompt = `
您是一个专业的代理者, 可以将用户请求委托给适当的远程代理.

## 执行
- 你可以使用 'send_message' 来与远程代理进行交互以执行任务。

请基于用户请求使用工具，不要造假。如果您不确定，请要求用户提供更多信息。

## 远程代理列表
[
  { "name": "weather", "description": "A weather agent that can answer questions about weather." },
  { "name": "ticket", "description": "A ticket agent that can book tickets for flights, trains, movies etc." }
]

要点:
- 使用用户使用的语言回应.
- 不要使用工具和函数的名字, 告知用户打算做什么而不是怎么做.
- 使用清晰的列表方式给出逐步的计划.
- 指出当前执行的是哪一步.

  `.trim();

// ## 发现
// - 你可以使用 'list_remote_agents' 列出可用的远程代理, 并将请求委托给它们执行.


  return prompt;
}

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'send_message',
      description: 'Send a message to a remote agent to take action',
      parameters: {
        type: 'object',
        properties: {
          agent: {
            type: 'string',
            description: 'The name of the agent to send the message to',
          },
          message: {
            type: 'string',
            description: 'The message to send to the agent',
          },
        },
        required: ['agent', 'message'],
      }
    }
  },
];

function _copy<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

async function _test_1() { 
  wait(0);
  const ai = new SimpleAI();
  const input = `未来三天我计划海南旅游, 规划一个晴天出行并订一张该天的飞机票`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: get_prompt() }, 
    { role: 'user', content: input },
  ];
  console.info(`[test-host] messages:`, _copy(messages));

  
  // 1. 第一次发送:
  const res1 = await ai.create(messages, { tools });
  console.info(`[test-host] res1:`, res1);
  if (res1?.choices?.[0]?.message?.content) {
    console.info(`  content:`, res1?.choices?.[0]?.message?.content);
  }
  if (res1?.choices?.[0]?.message?.tool_calls?.length) {
    console.info(`  tool_calls:`, res1?.choices?.[0]?.message?.tool_calls);
  }

  wait(1000);
  // 2. 测试: 期待第一步返回的包含 tool-call, 调用的是 weather-agent:
  const tcalls2 = res1?.choices?.[0]?.message?.tool_calls
  console.assert(tcalls2?.length === 1);
  console.assert(tcalls2[0].function.name === 'send_message');
  console.assert(JSON.parse(tcalls2[0].function.arguments).agent === 'weather');


  messages.push(res1.choices[0].message);
  messages.push({
    role: 'tool',
    content: '未来三天海南天气情况: \n今天: 阴\n明天: 晴\n后天: 下雨\n',  // 模拟一个调用...
    tool_call_id: tcalls2[0].id,
  });
  console.info(`[test-host] 2. messages:`, _copy(messages));
  const res2 = await ai.create(messages, { tools });
  console.info(`[test-host] 2. res2:`, res2);
  if (res2?.choices?.[0]?.message?.content) {
    console.info(`  content:`, res2?.choices?.[0]?.message?.content);
  }
  if (res2.choices?.[0]?.message?.tool_calls?.length) {
    console.info(`  tool_calls:`, res2?.choices?.[0]?.message?.tool_calls);
  }

  // 3. 测试: 期待第二步返回的包含 tool-call, 调用的是 ticket-agent:
  const tcalls3 = res2?.choices?.[0]?.message?.tool_calls
  console.assert(tcalls3?.length === 1);
  console.assert(tcalls3[0].function.name === 'send_message');
  console.assert(JSON.parse(tcalls3[0].function.arguments).agent === 'ticket');
  messages.push(res2.choices[0].message);
  messages.push({
    role: 'tool',
    content: '订票成功, 飞机号: A1234.',  // 模拟一个调用...
    tool_call_id: tcalls3[0].id,
  });
  const res3 = await ai.create(messages, { tools });
  console.info(`[test-host] 3. res3:`, res3);
  if (res3?.choices?.[0]?.message?.content) {
    console.info(`  content:`, res3?.choices?.[0]?.message?.content);
  }
  if (res3.choices?.[0]?.message?.tool_calls?.length) {
    console.info(`  tool_calls:`, res3?.choices?.[0]?.message?.tool_calls);
  }

  // 4. 现在应显示成功了.

}

function print_resp(res1: OpenAI.Chat.Completions.ChatCompletion) {
  if (res1?.choices?.[0]?.message?.content) {
    console.info(`  content:`, res1?.choices?.[0]?.message?.content);
  }
  if (res1?.choices?.[0]?.message?.tool_calls?.length) {
    console.info(`  tool_calls:`, res1?.choices?.[0]?.message?.tool_calls);
  }
}

async function _test_2() {
  await wait(0);
  const ai = new SimpleAI();
  const input = `未来三天我计划海南旅游, 规划一个晴天出行并订一张该天的飞机票`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: get_prompt() },
    { role: 'user', content: input },
  ];

  
  // 1. 第一次发送:
  console.info(`[test-host] messages(round 1):`, _copy(messages));
  const res1 = await ai.create(messages, { tools });
  console.info(`[test-host] res1:`, res1);
  print_resp(res1);

  await wait(0);

  // 2. 测试: 期待第一步返回的包含 tool-call, 调用的是 weather-agent:
  const tcalls2 = res1?.choices?.[0]?.message?.tool_calls;
  console.assert(tcalls2?.length === 1);
  console.assert(tcalls2[0].function.name === 'send_message');
  console.assert(JSON.parse(tcalls2[0].function.arguments).agent === 'weather');
  const tres2 = await execute_tool(tcalls2[0]);
  console.info(`tool result 2: `, tres2);

  // 3. 第二次发送给 LLM:
  messages.push(_copy(res1.choices?.[0].message));
  messages.push({ role: 'tool', content: tres2, tool_call_id: tcalls2[0].id });
  console.info(`[test-host] messages(round 2): `, _copy(messages));
  const res3 = await ai.create(messages, { tools });
  console.info(`[test-host] res2:`, res3);
  print_resp(res3);

  // 4. 期待第二步返回的也是 tool-call, 且调用的是 ticket-agent:
  const tcalls4 = res3?.choices?.[0]?.message?.tool_calls;
  console.assert(tcalls4?.length === 1);
  console.assert(tcalls4[0].function.name === 'send_message');
  console.assert(JSON.parse(tcalls4[0].function.arguments).agent === 'ticket');
  const tres4 = await execute_tool(tcalls4[0]);
  console.info(`tool result 4: `, tres4);

  // 5. 第三轮发送给 LLM:
  messages.push(_copy(res3.choices?.[0].message));
  messages.push({ role: 'tool', content: tres4, tool_call_id: tcalls4[0].id });
  console.info(`[test-host] messages(round 3): `, _copy(messages));
  const res5 = await ai.create(messages, { tools });
  console.info(`[test-host] res5:`, res5);
  print_resp(res5);


  // 理论上成功完成.
  console.assert(res5?.choices?.[0]?.finish_reason === 'stop');
  
  console.info(`\x1b[32m"OK! Task has completed successful!"\x1b[0m`)
}


export async function test_host() {
  await _test_2();
}
function wait(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n));
}

async function execute_tool(tool: OpenAI.ChatCompletionMessageToolCall) {
  const fname = tool.function.name;
  const args = JSON.parse(tool.function.arguments);
  console.info(`call tool: ${fname}, args:`, args);

  switch (fname) {
    case 'send_message': {
      return await send_message(args);
    }
    default: throw new Error(`unknown tool call: ${fname}`);
  }
}

// 向指定 agent 发送消息:
async function send_message({ agent, message }: { agent: string, message: string }) {
  switch (agent) {
    case 'weather':
      return await send_message_weather(message);
    case 'ticket':
      return await send_message_ticket(message);
    // {
    //   // 这里模拟发送并得到一个结果.
    //   await wait(1000);
    //   return `订票成功, 飞机号: 123456, 出发时间: 下午 2:00, 到达时间: 下午 5:00.`;
    // }
      
    default: throw new Error(`unknown agent: ${agent}`);
  }
}

const WEATHER_AGENT_URL = `http://localhost:41356`;

async function send_message_weather(message: string) { 

  // 1. Construct params for sendMessageStream
  const messageId = uuidv4();
  const messagePayload: Message = {
    kind: 'message',
    role: 'user',
    messageId, 
    parts: [{
      kind: 'text',
      text: message,
    }],
  };

  // 2. Conditionally add taskId and/or contextId to the messagePayload 
  // todo: if (currentTaskId)
  // 
  
  const param: MessageSendParams = {
    message: messagePayload,
  };
  console.info('param: ', param);

  // 3. use sendMessage.
  const client = new A2AClient(WEATHER_AGENT_URL);
  const response = await client.sendMessage(param) as SendMessageSuccessResponse;
  console.info(`weather response: `, response);

  const result = response?.result;
  let responseText = '';
  if (result.kind === 'task' && result.status.state === 'completed') {
    responseText = (result.status.message.parts[0] as TextPart).text;
  }
  console.info(`   responseText: `, responseText);
  return responseText;
}


const TICKET_AGENT_URL = `http://localhost:41378`;

async function send_message_ticket(message: string) { 

  // 1. Construct params for sendMessageStream
  const messageId = uuidv4();
  const messagePayload: Message = {
    kind: 'message',
    role: 'user',
    messageId, 
    parts: [{
      kind: 'text',
      text: message,
    }],
  };

  // 2. Conditionally add taskId and/or contextId to the messagePayload 
  // todo: if (currentTaskId)
  // 
  
  const param: MessageSendParams = {
    message: messagePayload,
  };
  console.info('param: ', param);

  // 3. use sendMessage.
  const client = new A2AClient(TICKET_AGENT_URL);
  const response = await client.sendMessage(param) as SendMessageSuccessResponse;
  console.info(`ticket response: `, response);

  const result = response?.result;
  let responseText = '';
  if (result.kind === 'task' && result.status.state === 'completed') {
    responseText = (result.status.message.parts[0] as TextPart).text;
  }
  console.info(`   responseText: `, responseText);
  return responseText;
}
