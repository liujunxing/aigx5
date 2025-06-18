import React from "react";
import { useAtom } from "jotai";
import { Box, Input, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";

import { configAtom } from "./ConfigValue";
import { StoreType } from "@shared/config-type";



export function LLMTab() {
  return React.useMemo(() => (
    <Box>
      <Typography variant="h6">当前应用大模型:</Typography>
      <CurrentProvider />

      <Typography variant="h6">豆包(火山引擎)配置</Typography>
      <Box className="pl-4 mb-2">
        <Doubao />
      </Box>

      <Typography variant="h6">千问(阿里大模型)配置</Typography>
      <Box className="pl-4 mb-2">
        <Qwen />
      </Box>
    </Box>
  ), [])
}

function CurrentProvider() {
  const [configValue, setConfigValue] = useAtom(configAtom);
  const provider = configValue.llm.current ?? '';
  
  const onSelectChange = (e: SelectChangeEvent<string>) => {
    setConfigValue({
      ...configValue,
      llm: {
        ...configValue.llm,
        current: e.target.value,
      }
    });
  };

  return (
    <Select value={provider}  onChange={onSelectChange}>
      <MenuItem value="doubao">豆包(火山引擎)</MenuItem>
      <MenuItem value="qwen">千问(阿里大模型)</MenuItem>
    </Select>
  )
}

function Doubao() {
  const [configValue, setConfigValue] = useAtom(configAtom);
  // console.info('LLMTab configValue:', configValue);

  const apiKey = configValue?.llm?.doubao?.apiKey ?? '';
  const model = configValue?.llm?.doubao?.model ?? '';
  const baseUrl = configValue?.llm?.doubao?.url ?? '';

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // console.info('handleApiKeyChange:', { value: event?.target?.value });
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
    // console.info('handleModelChange:', { value: event?.target?.value });
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
    // console.info('handleBaseUrlChange:', { value: event?.target?.value });
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
    <>
      <Typography>API Key: (形如 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 请注意保密)</Typography>
      <Input className="min-w-[40rem]" value={apiKey} onChange={handleApiKeyChange}></Input>

      <Typography>Model: (这里需要支持 function-call 的模型如 'doubao-1.5-pro-256k')</Typography>
      <Input className="min-w-[40rem]" value={model} onChange={handleModelChange}></Input>

      { /* 默认: https://ark.cn-beijing.volces.com/api/v3 */}
      <Typography>BaseUrl: (一般不用修改)</Typography>
      <Input className="min-w-[48rem]" value={baseUrl} onChange={handleBaseUrlChange}></Input>
    </>
  )
}


function useQwenCallback(key: keyof StoreType['llm']['qwen'], setConfigValue: any) {
  return React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setConfigValue(prev => ({
      ...prev, llm: { ...prev?.llm, qwen: { ...prev?.llm?.qwen, [key]: event.target.value } }
    }))
  }, [setConfigValue]);
}

function Qwen() {
  const [configValue, setConfigValue] = useAtom(configAtom);

  const apiKey = configValue?.llm?.qwen?.apiKey ?? '';
  const model = configValue?.llm?.qwen?.model ?? '';
  const baseUrl = configValue?.llm?.qwen?.url ?? '';

  const handleApiKeyChange = useQwenCallback('apiKey', setConfigValue);
  const handleModelChange = useQwenCallback('model', setConfigValue);
  const handleBaseUrlChange = useQwenCallback('url', setConfigValue);

  return (
    <>
      <Typography>API Key: (形如 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 请注意保密)</Typography>
      <Input className="min-w-[40rem]" value={apiKey} onChange={handleApiKeyChange}></Input>

      <Typography>Model: (如 qwen-plus, qwen-max)</Typography>
      <Input className="min-w-[40rem]" value={model} onChange={handleModelChange}></Input>

      { /* 默认: https://dashscope.aliyuncs.com/compatible-mode/v1 */}
      <Typography>BaseUrl: (一般不用修改)</Typography>
      <Input className="min-w-[48rem]" value={baseUrl} onChange={handleBaseUrlChange}></Input>
    </>
  )
}

