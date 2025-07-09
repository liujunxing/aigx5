import dotenv from 'dotenv';
import OpenAI from 'openai';
import { SimpleAI } from '../simple-ai';
import { weather_prompts } from './prompt';
import { wait } from '../wait';

const localEnv: Record<string, string> = {};
dotenv.config({ processEnv: localEnv });

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

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'book_airline_ticket',
      description: '订飞机票',
      parameters: {
        type: 'object',
        properties: {
          arrival_city: {
            type: 'string',
            description: '目的城市'
          }
        },
        required: ['arrival_city'],  // 
      }
    }
  }
];


// 执行 LLM 查询.
export async function execute_query(ai: SimpleAI, query: string) {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: weather_prompts },
    { role: 'user', content: query }
  ];

  const response1 = await ai.create(messages, { tools });

  // 如果 LLM 不调用 tools, 则直接返回.
  const tools1 = response1?.choices?.[0]?.message?.tool_calls;
  if (!tools1) { return response1; }

  // 执行工具:
  // console.info(`  [ticket] execute_query tools: `, tools1);
  const tool_result = await execute_tool(tools1[0]);

  // 第二轮调用:
  messages.push(response1.choices[0].message);  // 添加 LLM 的响应消息.
  messages.push({ role: 'tool', content: tool_result, tool_call_id: tools1[0].id });
  const response2 = await ai.create(messages);

  // 这里假设只执行一个工具.

  return response2;
}

async function execute_tool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
  console.info(`  [ticket] execute_tool ${toolCall.function.name} with:`, JSON.parse(toolCall.function.arguments));
  switch (toolCall.function.name) {
    case 'book_airline_ticket': {
      const { arrival_city } = JSON.parse(toolCall.function.arguments) as { arrival_city: string };
      console.info(`  [ticket] call to book_airline_ticket(${arrival_city})`)
      await wait(500);   // 假设花费了 500ms ...
      return `已预订了飞往 ${arrival_city} 的机票, 飞机编号: 123456, 出发时间: 下午 2:00, 到达时间: 下午 5:00.`;
    }
    default: 
      throw new Error(`[ticket] unknown tool call: ${toolCall.function.name}`);
  }
}
