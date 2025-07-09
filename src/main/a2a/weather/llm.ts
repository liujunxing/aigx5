import dotenv from 'dotenv';
import OpenAI from 'openai';
import { SimpleAI, type MessageType } from '../simple-ai';
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

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_city_weather',
      description: '查询指定城市的天气情况',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '城市名称, 如 "北京", "上海", "西安" 等'
          }
        },
        required: ['city'],  // 必须提供城市名称
      }
    }
  }
];


// 执行 LLM 查询.
export async function execute_query(ai: SimpleAI, query: string) {
  const messages: MessageType[] = [
    { role: 'system', content: weather_prompts },
    { role: 'user', content: query }
  ];

  const response1 = await ai.create(messages, { tools });

  // 如果 LLM 不调用 tools, 则直接返回.
  const tools1 = response1?.choices?.[0]?.message?.tool_calls;
  if (!tools1) { return response1; }

  // 执行工具:
  // console.info(`  [weather] execute_query tools: `, tools1);
  const tool_result = await execute_tool(tools1[0]);

  // 第二轮调用:
  messages.push(response1.choices[0].message);  // 添加 LLM 的响应消息.
  messages.push({ role: 'tool', content: tool_result, tool_call_id: tools1[0].id });
  const response2 = await ai.create(messages);

  return response2;
}

async function execute_tool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
  console.info(`  [weather] execute_tool ${toolCall.function.name} with:`, JSON.parse(toolCall.function.arguments));
  switch (toolCall.function.name) {
    case 'query_city_weather': {
      const args = JSON.parse(toolCall.function.arguments) as { city: string };
      // console.info(`  [weather] call to query_city_weather(${args.city}) ...`)
      await wait(500);   // 假设花费了 500ms 来查询天气到某个网站.
      return `${args.city} 的未来三天天气情况: 今天 晴朗, 明天 阴, 后天 大雨`;
    }
    default: 
      throw new Error(`[weather] unknown tool call: ${toolCall.function.name}`);
  }
}
