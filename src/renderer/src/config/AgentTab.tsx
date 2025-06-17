import { useAtom } from "jotai";
import { Box, Button, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

import { AgentDialog } from "./AgentDialog";
import { Agent, agentDialogOpened } from "./agent";

// 测试用:
const agents: Agent[] = [
  {
    name: '小智',
    description: '我是一个叫 xxx 的台湾女孩, 说话机车, 声音好听, 习惯简短表达, ...',
    voice: '弯弯小何',
    memory: '当前记忆...',
    model: 'Doubao',
  },
  {
    name: '豆豆',
    description: '我是可爱的豆豆, 喜欢听歌, 喜欢聊天, ...',
    voice: '可爱豆豆',
    memory: '当前记忆...',
    model: 'DeepSeek',
  },
  {
    name: '小宝',
    description: '我是好奇的小宝, 喜欢听歌, 喜欢聊天, ...',
    voice: '好奇小宝',
    memory: '当前记忆...',
    model: 'Qwen',
  },

];


interface AgentCardProps {
  agent: Agent;
}

function AgentCard({ agent }: AgentCardProps) {
  return (
    <Box width={'33%'} border={'1px solid lightgrey'} sx={{ margin: '5px', borderRadius: '5px', padding: '5px' }}>
      <Typography fontSize={20}>{agent.name}</Typography>
      {/* <Typography>{agent.description}</Typography> */}
      <Typography>角色语音: {agent.voice}</Typography>
      {/* <Typography>{agent.memory}</Typography> */}
      <Typography>语言模型: {agent.model}</Typography>
      <Typography>最近对话: </Typography>
    </Box>
  )
}


/*
 * 新建智能体含:
 *    角色模板 (台湾女友, 土豆子, English Tutor, 好奇小男孩, 汪汪队队长)
 *    助手昵称 [    ]
 *    角色音色 [    ]   (可选, 不支持)
 *    角色介绍 [         ]
 *            [         ]
 *    记忆体 (当前记忆 每次对话后重新生成)   清除记忆
 *            [           ]
 *    语言模型 [    ]  (Doubao, DeepSeek, Qwen)
 */
export function AgentTab() {
  const [opened, setAgentDialog] = useAtom(agentDialogOpened);

  const new_agent = () => {
    setAgentDialog(true);
  };

  return (
    <Box>
      <Typography>智能体(仅演示用界面, 功能未实现)</Typography>
      <Box>
        <Button variant="outlined" onClick={new_agent}>
          <Add fontSize="medium" /> 新建智能体
        </Button>
      </Box>
      <Box sx={{ display: 'flex' }}>
        {agents.map((agent) => (
          <AgentCard key={agent.name} agent={agent} />
        ))}
      </Box>
      <Box>
        {opened && <AgentDialog />}
      </Box>
    </Box>
  )
}
