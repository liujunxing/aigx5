import express from 'express';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import {
  type AgentCard,
  type AgentExecutor,
  type RequestContext,
  type ExecutionEventBus,
  type Task,
  type TaskStatusUpdateEvent,
  type TextPart,
  type Message,
  type TaskStore,
  InMemoryTaskStore,
  DefaultRequestHandler,
  A2AExpressApp,
} from '@a2a-js/sdk';
import OpenAI from 'openai';
import { create_ai, execute_query } from './llm';
import { wait } from '../wait';


const PORT = 41356;

const weatherAgentCard: AgentCard = {
  name: 'Weather Agent',
  description: 'Helps with weather',
  url: `http://localhost:${PORT}`,
  version: '0.1.0',
  provider: {
    organization: 'lexue100.com',
    url: 'https://example.com/a2a-samples' // Added provider URL
  },
  capabilities: {
    streaming: true,                  // The new framework supports streaming
    pushNotifications: false,         // Assuming not implemented for this agent yet
    stateTransitionHistory: true,     // Agent uses history
  },
  securitySchemes: undefined,
  security: undefined,
  defaultInputModes: ['text'],
  defaultOutputModes: ['text', 'task-status'],    // task-status is a common output mode
  skills: [
    {
      id: 'weather_search',
      name: 'Search Weather',
      description: 'Helps with weather in city, or states',
      tags: ['weather'],
      examples: [
        '北京今天的天气',
        '明天北京会下雨吗?'
      ],
      // todo: input 'city'
    }
  ],
};

class WeatherAgentExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus) {
    await wait(0);

    // 获得输入:
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;
    const taskId = existingTask?.id || uuidv4();
    const contextId = userMessage.contextId || existingTask?.contextId || uuidv4();
    console.info(`[weather-agent] Processing message ${userMessage.messageId} for task ${taskId} context:${contextId}`);

    // 可以发布的内容类型:  Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

    // 1. Publish initial Task event if it's a new task 
    if (!existingTask) {
      const initialTask: Task = {
        kind: 'task',
        id: taskId,
        contextId: contextId,
        status: {
          state: "submitted",
          timestamp: new Date().toISOString(),
        },
        history: [userMessage],           // Start history with the current user message
        metadata: userMessage.metadata,   // Carry over metadata from message if any
      };
      eventBus.publish(initialTask);
      console.info(`[weather-agent] 1. Publish initial task: ${taskId}`)
    }

    // 2. Publish 'working' status update
    const workingStatusUpdate: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId: taskId,
      contextId: contextId,
      status: {
        state: "working",
        message: {
          kind: 'message',
          role: 'agent',
          messageId: uuidv4(),
          parts: [{ kind: 'text', text: 'Processing your question, hang tight!' }],
          taskId: taskId,
          contextId: contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    };
    eventBus.publish(workingStatusUpdate);
    console.info(`[weather-agent] 2. Publish working status for task ${taskId}`)

    // 3. 准备 LLM 调用. 为了简化问题, 这里仅认为 userMessage.parts 只有一个文本元素.
    const ai = create_ai();
    // console.info(`ai object:`, ai);

    const query = (userMessage.parts[0] as TextPart).text;
    const historyMessages: OpenAI.ChatCompletionMessageParam[] = [{
      role: 'user',
      content: query,
    }];
    console.info(`[weather-agent] 3. Preparing LLM call with query: ${query}`);

    // 4. 执行 LLM 调用.  错误处理 暂时略.
    // const response = await ai.create(historyMessages);
    const response = await execute_query(ai, query);
    const responseText = response?.choices?.[0]?.message?.content || '';
    console.info(`[weather-agent] 4. LLM response: ${responseText}`);
    
    // 现在假设总是成功 (不含 tool-call 部分)
    const finalA2AState = 'completed';

    // 5. Publish final task status update
    const message: Message = {   // 用于 finalUpdate event 中.
      kind: 'message',
      role: 'agent',
      messageId: uuidv4(),
      parts: [{ kind: 'text', text: responseText }],
      taskId, 
      contextId,
    };
    const finalUpdate: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId,
      status: {
        state: finalA2AState,
        message,
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(finalUpdate);
    console.info(`[weather-agent] 5. Publish final status for task ${taskId} with state: ${finalA2AState}`);

    await wait(0);
    console.log(`[weather-agent] 0. Task ${taskId} completed with state: ${finalA2AState}`);
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus) {
    console.info(`[weather-agent] cancelTask task:${taskId} (UNIMPL)`);
    // throw new Error('cancelTask is not supported');
  }
}


// --- Server Setup ---

async function main() {
  // 1. Create TaskStore
  const taskStore: TaskStore = new InMemoryTaskStore();

  // 2. Create AgentExecutor
  const agentExecutor: AgentExecutor = new WeatherAgentExecutor();

  // 3. Create DefaultRequestHandler
  const requestHandler = new DefaultRequestHandler(
    weatherAgentCard,
    taskStore,
    agentExecutor
  );

  // 4. Create and setup A2AExpressApp
  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express());

  // 5. Start the server
  // const PORT = process.env.PORT || 41241;
  expressApp.listen(PORT, () => {
    console.log(`[weather-agent] Server using new framework started on http://localhost:${PORT}`);
    console.log(`[weather-agent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`);
    console.log('[weather-agent] Press Ctrl+C to stop the server');
  });
}

main().catch(console.error);
