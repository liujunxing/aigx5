import OpenAI from "openai";

import { getLLMConfig } from "./llm-config";
import { GeoTools } from "./tools/index";

/**
 * Doubao AI client for interacting with Doubao's LLM API (with simple geo function-call support)
 * 
 * 经测试, 通义千问也可以用...
 */  
export class DoubaoAI {
  public readonly provider: string;
  private _baseUrl: string;
  private _apiKey: string;
  private _model: string;

  private _openai: OpenAI;
  public _tools = GeoTools;

  public constructor() {
    const cfg = getLLMConfig();
    const provider = this.provider = cfg?.current ?? 'doubao';
    
    switch (provider) {
      case 'doubao':
      default:
        this._baseUrl = cfg?.doubao?.url ?? 'https://ark.cn-beijing.volces.com/api/v3';
        this._apiKey = cfg?.doubao?.apiKey ?? '';
        this._model = cfg?.doubao?.model ?? 'ep-xxxxxxxxxxxxxx-xxxx';
        break;
      case 'qwen':
        this._baseUrl = cfg?.qwen?.url ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        this._apiKey = cfg?.qwen?.apiKey ?? '';
        this._model = cfg?.qwen?.model ?? 'qwen-max';
    }

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
