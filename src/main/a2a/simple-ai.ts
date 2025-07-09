import OpenAI from "openai";


export type AIOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class SimpleAI {
  private _baseUrl: string;
  private _apiKey: string;
  private _model: string;

  private _openai: OpenAI;

  public constructor(opt: AIOptions) {
    this._baseUrl = opt.baseUrl ?? '';
    this._apiKey = opt.apiKey ?? '';
    this._model = opt.model ?? '';

    this._openai = new OpenAI({
      baseURL: this._baseUrl,
      apiKey: this._apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  public async create(messages: OpenAI.ChatCompletionMessageParam[], opt: any = {}) {
    return this._openai.chat.completions.create({
      ...opt,
      model: this._model,
      messages,
    });
  }

  public async createStream(messages: OpenAI.ChatCompletionMessageParam[], opt: any = {}) {
    return this._openai.chat.completions.create({
      ...opt,
      model: this._model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });
  }

}
