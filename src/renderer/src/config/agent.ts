import { atom } from "jotai";

// 测试用 智能体[]
export interface Agent {
  name: string;             // 助手昵称
  description: string;      // 角色介绍
  voice: string;            // 角色音色 
  memory: string;           // 记忆体
  model: string;            // 语言模型
}

export const agentDialogOpened = atom(false);
