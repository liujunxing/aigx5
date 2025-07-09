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
} from "@a2a-js/sdk";


console.info(`[test-agent] is starting ...`);

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const PORT = 41253;


const PUBLISH_WORKING_STATE = false;  // true


class TestAgentExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    console.info(`[test-agent] execute ...`, requestContext);
    await wait(0);

    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;

    const taskId = requestContext.taskId;
    const contextId = requestContext.contextId;
    console.log(`[test-agent] process message ${userMessage.messageId} for task ${taskId} context ${contextId}`);

    // 1. publish initial task 
    if (!existingTask) {
      console.info(`[test-agent] 1. publish initial task of 'submitted'`);
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
    if (PUBLISH_WORKING_STATE) {
      console.info(`[test-agent] 2. publish status-update to 'working'`);
      eventBus.publish({
        kind: 'status-update',
        taskId,
        contextId,
        status: {
          state: 'working', 
          // 我们不给 message 部分会如何?
          /*
          message: {
            kind: 'message',
            role: 'agent',
            messageId: uuidv4(),
            parts: [{ kind: 'text', text: '' }],
            taskId, contextId,
          },
          */
          timestamp: new Date().toISOString(),
        },
        final: false,
      });
    }

    // 3. Prepare messages for Genkit prompt (为 LLM 准备输入消息)
    const historyForGenkit: Message[] = [];
    historyForGenkit.push(userMessage);
    console.info(`[test-agent] 3. prepare messages for llm ...`)

    // todo: try
    // 4. Run the Genkit prompt
    await wait(100);   // 假设花费了 100ms

    const responseText = `你好啊, 这是一个测试响应文本`;
    console.info(`[test-agent] 4. Prompt response: ${responseText}`);
    
    // 5. Publish final task status update
    const agentMessage: Message = {
      kind: 'message',
      role: 'agent',
      messageId: uuidv4(),
      parts: [{ kind: 'text', text: responseText || "Completed." }], // Ensure some text
      taskId: taskId,
      contextId: contextId,
    };
    historyForGenkit.push(agentMessage);

    console.info(`[test-agent] 5. publish final-update: completed`)
    const finalUpdate: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId: taskId,
      contextId: contextId,
      status: {
        state: 'completed',   // 假设响应是完成状态
        message: agentMessage,
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(finalUpdate);

    console.info(`[test-agent] Task ${taskId} finished with state: completed`)
  }

  async cancelTask(taskId: string, _eventBus: any): Promise<void> {
    console.info(`[test-agent] cancelTask task:${taskId}`);
    throw new Error('cancelTask is not supported');
  }

}

const simpleAgentCard: AgentCard = {
  name: 'Test Agent',
  description: 'An agent that is used to do some a2a test',
  url: `http://localhost:${PORT}/`,
  provider: {
    organization: 'A2A Samples',
    url: 'https://example.com/a2a-samples' // Added provider URL
  },
  version: '0.0.4', // Incremented version
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
      id: 'simple_echo',
      name: 'Simple Echo',
      description: 'echo random text',
      tags: ['simple', 'echo'],
      examples: [
        'hello',
        'echo something random',
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
  const agentExecutor: AgentExecutor = new TestAgentExecutor();

  // 3. Create DefaultRequestHandler
  const requestHandler = new DefaultRequestHandler(
    simpleAgentCard,
    taskStore,
    agentExecutor
  );

  // 4. Create and setup A2AExpressApp
  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express());

  expressApp.listen(PORT, () => {
    console.log(`[test-agent] Server using new framework started on http://localhost:${PORT}`);
    console.log(`[test-agent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`);
    console.log('[test-agent] Press Ctrl+C to stop the server');
  });

}

main();
