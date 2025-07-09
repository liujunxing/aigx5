import OpenAI from 'openai';
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
import { wait } from '../wait';
import { SimpleAI, type MessageType } from '../simple-ai';


const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_remote_agents',
      description: 'List the available remote agents',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_message',
      description: 'Send a message to a remote agent to take action',
      parameters: {
        type: 'object',
        properties: {
          agent_name: {
            type: 'string',
            description: 'The name of the remote agent to send the message to',
          },
          message: {
            type: 'string',
            description: 'The message to send to the remote agent',
          },
        },
        required: ['agent_name', 'message'],
      },
    },
  },
];


// 提供两个 prompt 做为参考.
function get_prompts() { 

  const prompt1 = 
`
You are an expert delegator that can delegate the user request to the
appropriate remote agents.

Discovery:
- You can use 'list_remote_agents' to list the available remote agents you
can use to delegate the task.

Execution:
- For actionable requests, you can use 'send_message' to interact with remote agents to take action.

Be sure to include the remote agent name when you respond to the user.

Please rely on tools to address the request, and don't make up the response. If you are not sure, please ask the user for more details.
Focus on the most recent parts of the conversation primarily.

Agents:
{self.agents}

Current agent: {current_agent['active_agent']}
`;
  
  
  const prompt2 = `
**Role:** You are an expert Routing Delegator. Your primary function is to accurately delegate user inquiries regarding weather or accommodations to the appropriate specialized remote agents.

**Core Directives:**

* **Task Delegation:** Utilize the 'send_message' function to assign actionable tasks to remote agents.
* **Contextual Awareness for Remote Agents:** If a remote agent repeatedly requests user confirmation, assume it lacks access to the         full conversation history. In such cases, enrich the task description with all necessary contextual information relevant to that         specific agent.
* **Autonomous Agent Engagement:** Never seek user permission before engaging with remote agents. If multiple agents are required to         fulfill a request, connect with them directly without requesting user preference or confirmation.
* **Transparent Communication:** Always present the complete and detailed response from the remote agent to the user.
* **User Confirmation Relay:** If a remote agent asks for confirmation, and the user has not already provided it, relay this         confirmation request to the user.
* **Focused Information Sharing:** Provide remote agents with only relevant contextual information. Avoid extraneous details.
* **No Redundant Confirmations:** Do not ask remote agents for confirmation of information or actions.
* **Tool Reliance:** Strictly rely on available tools to address user requests. Do not generate responses based on assumptions. If         information is insufficient, request clarification from the user.
* **Prioritize Recent Interaction:** Focus primarily on the most recent parts of the conversation when processing requests.
* **Active Agent Prioritization:** If an active agent is already engaged, route subsequent related requests to that agent using the         appropriate task update tool.

**Agent Roster:**

* Available Agents: {self.agents}
* Currently Active Agent: {current_agent['active_agent']}
  `;
  
  return prompt1;
}


// Simple store for contexts
const contexts: Map<string, Message[]> = new Map();

const PORT = 12345;

const hostAgentCard: AgentCard = {
  name: 'Host Agent',
  description: 'This is the agent responsible for choosing which remote agents to send tasks to and coordinate their work.',
  url: `http://localhost:${PORT}`,
  version: '0.1.1',
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
  ],
};

class HostAgentExecutor implements AgentExecutor {
  public async execute(requestContext: RequestContext, eventBus: ExecutionEventBus) {
    await wait(0);
    // 获得输入:
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;
    const taskId = existingTask?.id || uuidv4();
    const contextId = userMessage.contextId || existingTask?.contextId || uuidv4();
    console.info(`[host-agent] Processing message ${userMessage.messageId} for task ${taskId} context:${contextId}`);

    // 1. Publish initial task event if it's a new task 
    if (!existingTask) {
      const initialTask: Task = {
        kind: 'task',
        id: taskId,
        contextId: contextId,
        status: {
          state: "submitted",
          timestamp: new Date().toISOString(),
        },
        history: [userMessage], // Start history with the current user message
        metadata: userMessage.metadata, // Carry over metadata from message if any
      };
      eventBus.publish(initialTask);
      console.info(`[host-agent] 1. publish initial task id: ${taskId}, contextId: ${contextId}`)
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
    console.info(`[host-agent] 2. publish working status update for task: ${taskId}, contextId: ${contextId}`);

    // 3. Prepare messages for LLM prompt
    const historyForGenkit = contexts.get(contextId) || [];
    if (!historyForGenkit.find(m => m.messageId === userMessage.messageId)) { 
      historyForGenkit.push(userMessage);
    }
    contexts.set(contextId, historyForGenkit);   // 这个调用似乎没有必要...

    // 给 LLM 的消息.
    const messages: OpenAI.ChatCompletionMessageParam[] = historyForGenkit
      .map(m => ({
        role: m.role === 'agent' ? 'assistant' : m.role,
        content: 'todo:'
      } as OpenAI.ChatCompletionMessageParam))
      ;
    console.info(`[host-agent] 3.1 messages to llm:`, messages);
    messages.unshift({   // 最前面加上系统提示.
      role: 'system',
      content: get_prompts(),
    });

  }

  public async cancelTask(taskId: string, eventBus: ExecutionEventBus) {
    throw new Error(`cancelTask() is unimplemented.`);
  }
}
