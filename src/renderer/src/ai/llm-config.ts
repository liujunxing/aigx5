import { addConfigChangeListener } from "@renderer/config/config-change-notify";
import { DesktopPlatform } from "@renderer/utils/platform";
import { LLMConfig } from "@shared/config-type";


// LLM 的配置信息.
let llmConfig: LLMConfig = {
} as unknown as LLMConfig;

// 从 store 中加载 LLM 配置信息. 此函数运行于浏览器环境.
// 注意这个是异步加载的...
export async function fetchLLMConfig() {
  const store = await DesktopPlatform.getStore();
  const llm = store?.llm ?? {} as any;
  console.info('fetchLLMConfig:', store);
  if (llm)
    llmConfig = llm;
  return llm;
}

export function getLLMConfig() {
  return llmConfig;
}

// 注册配置变更监听器, 当配置变更时, 重新加载 LLM 配置信息.
addConfigChangeListener(async () => {
  await fetchLLMConfig();
});
