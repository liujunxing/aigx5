import express from "express";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

import { 
  type AgentExecutor,
  type RequestContext,
  type ExecutionEventBus,
  type AgentCard,
  type TaskStore,
  type Message,
  type TaskState,
  type TaskStatusUpdateEvent,
  InMemoryTaskStore,
  DefaultRequestHandler,
  A2AExpressApp,
  TextPart,
} from "@a2a-js/sdk";
import dotenv from 'dotenv';
import { SimpleAI } from "./simple-ai";
import OpenAI from 'openai';

const localEnv: Record<string, string> = {};
dotenv.config({ processEnv: localEnv });

function create_ai() {
  const baseUrl = localEnv.DOUBAO_URL;
  const apiKey = localEnv.DOUBAO_API_KEY;
  const model = localEnv.DOUBAO_MODEL;

  return new SimpleAI({
    baseUrl,
    apiKey,
    model,
  });
}


console.info(`[leaf-agent] presented`);

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const PORT = 41255;

// ? contexts

class LeafAgentExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    console.info(`[leaf-agent] execute ...`, requestContext);
    await wait(0);   

    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;

    const taskId = requestContext.taskId;
    const contextId = requestContext.contextId;
    console.log(`[leaf-agent] process message ${userMessage.messageId} for task ${taskId} context ${contextId}`);

    // 1. publish initial task 
    if (!existingTask) {
      console.info(`[leaf-agent] 1. publish initial task `);
      eventBus.publish({
        kind: 'task',
        id: taskId, 
        contextId,
        status: { state: 'submitted', timestamp: new Date().toISOString() },
        history: [userMessage],
        metadata: userMessage.metadata
      });
    }

    // 2. publish 'working' status update 
    // ??问题: 调用方会收到这个消息, 按理这是中间状态...
    console.info(`[leaf-agent] 2. publish 'working' status update`);
    eventBus.publish({
      kind: 'status-update',
      taskId,
      contextId,
      status: {
        state: 'working',
        message: {
          kind: 'message',
          role: 'agent',
          messageId: uuidv4(),
          parts: [{ kind: 'text', text: 'processing your question, please wait ...' }],
          taskId, contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    });

    // 3. Prepare messages for LLM prompt (为 LLM 准备输入消息)
    const historyForLLM: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    historyForLLM.push({
      role: 'user',
      content: (userMessage.parts[0] as TextPart).text
    });
    console.info(`[leaf-agent] 3. prepare messages for llm ...`)

    // 4. Run the openai...
    const ai = create_ai();
    const response = await ai.create(historyForLLM);
    // await wait(100);   // 假设花费了 100ms

    const responseText = response?.choices?.[0]?.message?.content ?? `no response from ai`;
    console.info(`[leaf-agent] 4. Prompt response: ${responseText}`);
    
    let finalA2AState: TaskState = "completed";   // 假设响应是完成状态

    // 5. Publish final task status update
    const agentMessage: Message = {
      kind: 'message',
      role: 'agent',
      messageId: uuidv4(),
      parts: [{ kind: 'text', text: responseText || "Completed." }], // Ensure some text
      taskId: taskId,
      contextId: contextId,
    };
    // historyForLLM.push(agentMessage);

    console.info(`[leaf-agent] 5. publish final-update`)
    const finalUpdate: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId: taskId,
      contextId: contextId,
      status: {
        state: finalA2AState,
        message: agentMessage,
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(finalUpdate);

    console.info(`[leaf-agent] Task ${taskId} finished with state: ${finalA2AState}`)
  }

  async cancelTask(taskId: string, _eventBus: any): Promise<void> {
    console.info(`[leaf-agent] cancelTask task:${taskId}`);
  }

}

const leafAgentCard: AgentCard = {
  name: 'Leaf Agent',
  description: 'An agent that do not call other APIs, tools and agents, but just answer simple questions',
  url: `http://localhost:${PORT}/`,
  provider: {
    organization: 'A2A Samples',
    url: 'https://example.com/a2a-samples' // Added provider URL
  },
  version: '0.0.5', // Incremented version
  capabilities: {
    streaming: true, // The new framework supports streaming
    // todo: pushNotifications: false, // Assuming not implemented for this agent yet
    // todo: stateTransitionHistory: true, // Agent uses history
  },
  // authentication: null, // Property 'authentication' does not exist on type 'AgentCard'.
  // securitySchemes: undefined, // Or define actual security schemes if any
  // security: undefined,
  defaultInputModes: ['text'],
  defaultOutputModes: ['text', 'task-status'], // task-status is a common output mode
  skills: [
    {
      id: 'basic_chat',
      name: 'Basic Chat',
      description: 'Answer basic/general questions',
      tags: ['basic', 'general', 'chatting'],
      examples: [
        '你喜欢什么?',
        '请推荐一个好电影。',
      ],
      inputModes: ['text'], // Explicitly defining for skill
      outputModes: ['text', 'task-status'] // Explicitly defining for skill
    },
  ],
  // supportsAuthenticatedExtendedCard: false,
};

async function main() {
  // 1. Create TaskStore
  const taskStore: TaskStore = new InMemoryTaskStore();

  // 2. Create AgentExecutor
  const agentExecutor: AgentExecutor = new LeafAgentExecutor();

  // 3. Create DefaultRequestHandler
  const requestHandler = new DefaultRequestHandler(
    leafAgentCard,
    taskStore,
    agentExecutor
  );

  // 4. Create and setup A2AExpressApp
  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express());

  expressApp.listen(PORT, () => {
    console.log(`[leaf-agent] Server using new framework started on http://localhost:${PORT}`);
    console.log(`[leaf-agent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`);
    console.log('[leaf-agent] Press Ctrl+C to stop the server');
  });

}

main();
