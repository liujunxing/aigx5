import { OpenAI } from "openai";

import { getLLMConfig } from "./llm-config";


/**
 * DoubaoAI class for interacting with Doubao Vision LLM.
 */
export class DoubaoAI {
  private _baseUrl: string;  
  private _apiKey: string;
  private _model: string;

  private _openai: OpenAI;

  public constructor() {
    const cfg = getLLMConfig();

    this._baseUrl = cfg?.doubao_vision?.url ?? '';    // DOUBAO_VISION_URL
    this._apiKey = cfg?.doubao_vision?.apiKey ?? '';  // DOUBAO_VISION_API_KEY
    this._model = cfg?.doubao_vision?.model ?? '';    // DOUBAO_VISION_MODEL

    this._openai = new OpenAI({
      baseURL: this._baseUrl,
      apiKey: this._apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  // private _temperature = 0.7;

  public async create(messages: any[]) {
    return this._openai.chat.completions.create({
      model: this._model,
      messages,
      // tools: this.tools,
      // temperature: this._temperature
    });
  }

}
