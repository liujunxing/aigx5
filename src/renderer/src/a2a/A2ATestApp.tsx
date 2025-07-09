import { v4 as uuidv4 } from "uuid";
import { 
  type AgentCard,
  type Message,
  type MessageSendParams,
} from "@a2a-js/sdk";

import { A2AClient } from "@a2a-js/sdk/build/src/client/client.js";
import { useRef } from "react";

import { test_host } from './host/TestHost';
import { Button } from "@mui/material";

// A2A 测试用.
export function A2ATestApp() {
  const refInput = useRef<HTMLInputElement>(null);

  const get_agent_card = () => {
    // console.info('test button is clicked');
    test_fetch_agentcard();
  };

  const send_msg = () => {
    const input = refInput.current!.value || 'hello';
    test_agent_chat(input);
  };

  const send_msg_stream = () => {
    test_agent_chat_stream();
  };

  const _test_host = async () => {
    test_host();
  }

  const noTextTrans = { textTransform: 'none' };
  return (
    <div>
      <h2>A2A Test App</h2>
      <input ref={refInput} type="text" size={40} style={{ border: '1px solid black' }} />
      <div> 
        <Button variant="outlined" sx={noTextTrans} onClick={get_agent_card}>AgentCard</Button> &nbsp;
        <Button variant="outlined" sx={noTextTrans} className="normal-case" onClick={send_msg}>SendMessage</Button> &nbsp;
        <Button variant="outlined" sx={noTextTrans} className="normal-case" onClick={send_msg_stream}>SendMessageStream</Button>
      </div>
      <div>
        <Button variant="outlined" sx={noTextTrans} onClick={_test_host}>Test Host</Button> &nbsp;
      </div>
    </div>
  )
}

// const AGENT_PORT = 41356;   // weather
const AGENT_PORT = 41378;   // ticket
const AGENT_URL = `http://localhost:${AGENT_PORT}/`;

// 测试1: 连接 a2a agent, 获取 agent-card 等.
async function test_fetch_agentcard() {
  const response = await fetch(`${AGENT_URL}.well-known/agent.json`, {
    method: 'GET',
  });
  // console.info('response:', response);

  // const content = await response.text();
  // console.info('content:', content);

  const agentCard: AgentCard = await response.json();
  console.info('agent-card:', agentCard);

  // ---
  const client = new A2AClient(AGENT_URL);
  const ac2 = await client.getAgentCard();
  console.info(`agent-card(from client):`, ac2);
}

// 测试2: 与 basic-agent 聊天(发送一个请求)
async function test_agent_chat(input: string = 'hello') {
  console.info(`test_agent_chat() ...`);

  // 1. Construct params for sendMessageStream
  const messageId = uuidv4();
  const messagePayload: Message = {
    kind: 'message',
    role: 'user',
    messageId, 
    parts: [{
      kind: 'text',
      text: input,
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
  const client = new A2AClient(AGENT_URL);
  const response = await client.sendMessage(param);
  console.info(`response: `, response);
}

// 测试3: 使用 sendMessageStream 方法调用 agent 
async function test_agent_chat_stream(input: string = 'hello') {
  console.info(`test_agent_chat_stream() ...`);

  // 1. Construct params for sendMessageStream
  const messageId = uuidv4();
  const messagePayload: Message = {
    kind: 'message',
    role: 'user',
    messageId, 
    parts: [{
      kind: 'text',
      text: input,
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
  const client = new A2AClient(AGENT_URL);
  const stream = await client.sendMessageStream(param);   // 这里不需要 await

  console.info(`-- begin of response stream --`)
  for await (const event of stream) {
    console.info(` event: `, event);
  }
  console.info(`-- end of response stream --`)
  
}
