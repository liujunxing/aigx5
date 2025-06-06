import React from "react";
import { useAtom } from "jotai";
import { Box, Input, Typography } from "@mui/material";

import { configAtom } from "./ConfigValue";



function _LLMTab() {
  const [configValue, setConfigValue] = useAtom(configAtom);
  console.info('LLMTab configValue:', configValue);

  const apiKey = configValue?.llm?.doubao?.apiKey ?? '';
  const model = configValue?.llm?.doubao?.model ?? '';
  const baseUrl = configValue?.llm?.doubao?.url ?? '';

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.info('handleApiKeyChange:', { value: event?.target?.value });
    // 这个麻烦的结构, 怎么处理好呢? 也许让 AI 写就行了, 不用我们劳累了...
    const newConfigValue = {
      ...configValue,
      llm: {
        ...configValue?.llm,
        doubao: {
          ...configValue?.llm?.doubao,
          apiKey: event.target.value,
        }
      }
    };
    setConfigValue(newConfigValue);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.info('handleModelChange:', { value: event?.target?.value });
    const newConfigValue = {
      ...configValue,
      llm: {
        ...configValue?.llm,
        doubao: {
          ...configValue?.llm?.doubao,
          model: event.target.value,
        }
      }
    };
    setConfigValue(newConfigValue);
  };

  const handleBaseUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.info('handleBaseUrlChange:', { value: event?.target?.value });
    const newConfigValue = {
      ...configValue,
      llm: {
        ...configValue?.llm,
        doubao: {
          ...configValue?.llm?.doubao,
          url: event.target.value,
        }
      }
    };
    setConfigValue(newConfigValue);
  };
  
  return (
    <Box> 
      <Typography variant="h6">豆包(火山引擎)配置</Typography>

      <Box className="pl-4">
        <Typography>API Key: (形如 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 请注意保密)</Typography>
        <Input className="min-w-[40rem]" value={apiKey} onChange={handleApiKeyChange}></Input>

        <Typography>Model: (这里需要支持 function-call 的模型如 'doubao-1.5-pro-256k')</Typography>
        <Input className="min-w-[40rem]" value={model} onChange={handleModelChange}></Input>

        { /* 默认: https://ark.cn-beijing.volces.com/api/v3 */ }
        <Typography>BaseUrl: (一般不用修改)</Typography>
        <Input className="min-w-[48rem]" value={baseUrl} onChange={handleBaseUrlChange}></Input>
      </Box>
    </Box>
  )
}

export const LLMTab = React.memo(_LLMTab);
