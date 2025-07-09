import dotenv from 'dotenv';
import { SimpleAI, MessageType } from "./simple-ai";
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

// @ts-ignore
async function test_1() {
  const ai = create_ai();
  const messages: MessageType[] = [
    { role: 'user', content: '今天北京天气如何?' },
    // { role: 'user', content: '你好, 请问你是谁?' },
    // { role: 'assistant', content: '你好, 我是电影助手, 可以帮你查询电影相关的信息.' },
    // { role: 'user', content: '请问《阿凡达》这部电影的导演是谁?' },
  ];

  const res = await ai.create(messages);
  // console.info(`res:`, res);
  console.info(`msg-cont: `, res?.choices?.[0]?.message?.content);
}

test_1();
