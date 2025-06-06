import { OpenAI } from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions/index.mjs";

import { getLLMConfig } from "./llm-config";
import { GeoTools } from "./tools/index";

/**
 * Doubao AI client for interacting with Doubao's LLM API (with simple geo function-call support)
 */  
export class DoubaoAI {
  private _baseUrl: string;
  private _apiKey: string;
  private _model: string;

  private _openai: OpenAI;
  public _tools = GeoTools;

  public constructor() {
    const cfg = getLLMConfig();
    this._baseUrl = cfg?.doubao?.url ?? 'https://ark.cn-beijing.volces.com/api/v3';     // DOUBAO_URL;
    this._apiKey = cfg?.doubao?.apiKey ?? '';   // DOUBAO_API_KEY;
    this._model = cfg?.doubao?.model ?? '';     // DOUBAO_MODEL;

    this._openai = new OpenAI({
      baseURL: this._baseUrl,
      apiKey: this._apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  // @ts-ignore
  // private _temperature = 0.7;

  public async create(messages: any[]) {
    return this._openai.chat.completions.create({
      model: this._model,
      messages,
      tools: this._tools,
      // temperature: this._temperature
    });
  }

}
