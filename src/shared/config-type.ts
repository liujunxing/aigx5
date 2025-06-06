export interface StoreType {
  basic: BasicConfig;
  llm: LLMConfig;
}


// 基本(其它)配置
export interface BasicConfig {

}

// 大模型(LLM) 的配置
export interface LLMConfig {
  // 用于几何应用 GraphApp 的 Doubao AI 配置, 其要求 LLM 支持 function-call 功能. (当前)为此需要选用 doubao-1.5-pro-xxx 系列
  doubao: {
    apiKey: string;     // 如 'f6ea6ffb-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    model: string;      // 如 'ep-xxxxxxxxxxxxxx-xxxx', 注意应选择正确的模型(如 doubao-1.5-pro-256k)
    url: string;        // 如 'https://ark.cn-beijing.volces.com/api/v3'
  };

  // (不重要, 未使用) 用于 Fabric 应用的 Doubao AI 配置, 其要求 LLM 支持图片识别, 为此需要 doubao-1.5-vision-pro 系列
  doubao_vision: {
    apiKey: string;     // 如 'f6ea6ffb-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    model: string;      // 如 'ep-xxxxxxxxxxxxxx-xxxx', 注意应选择正确的模型(如 doubao-1.5-vision-pro-xxx)
    url: string;        // 如 'https://ark.cn-beijing.volces.com/api/v3'
  };
}
