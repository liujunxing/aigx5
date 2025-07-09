import dotenv from 'dotenv';
import OpenAI from 'openai';
import { SimpleAI, type MessageType } from '../simple-ai';
import { wait } from '../wait';

const localEnv: Record<string, string> = {};
dotenv.config({ processEnv: localEnv });

const host_prompts = `
You are an expert delegator that can delegate the user request to the
appropriate remote agents.

Discovery:
- You can use \`list_remote_agents\` to list the available remote agents you
can use to delegate the task.

Execution:
- For actionable requests, you can use \`send_message\` to interact with remote agents to take action.

Be sure to include the remote agent name when you respond to the user.

Please rely on tools to address the request, and don't make up the response. If you are not sure, please ask the user for more details.
Focus on the most recent parts of the conversation primarily.

Agents:
{agent_lists}

Current agent: {current_agent}
`.trim();


export function create_ai() {
  const baseUrl = localEnv.DOUBAO_URL;
  const apiKey = localEnv.DOUBAO_API_KEY;
  const model = localEnv.DOUBAO_MODEL;

  return new SimpleAI({
    baseUrl,
    apiKey,
    model,
  });
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
];


// 执行 LLM 查询.
export async function execute_query(ai: SimpleAI, query: string) {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: host_prompts },
    { role: 'user', content: query }
  ];

  const response1 = await ai.create(messages, { tools });

  // 如果 LLM 不调用 tools, 则直接返回.
  const tools1 = response1?.choices?.[0]?.message?.tool_calls;
  if (!tools1) { return response1; }

  // 执行工具:
  console.info(`[host] execute_query tools: `, tools1);
  throw new Error(`[host] todo: tools ...`);

  // const tool_result = await execute_tool(tools1[0]);

  // // 第二轮调用:
  // messages.push(response1.choices[0].message);  // 添加 LLM 的响应消息.
  // messages.push({ role: 'tool', content: tool_result, tool_call_id: tools1[0].id });
  // const response2 = await ai.create(messages);

  // return response2;
}

async function execute_tool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
  switch (toolCall.function.name) {
    default: 
      throw new Error(`[weather] unknown tool call: ${toolCall.function.name}`);
  }
}
