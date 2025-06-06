import {
  Box, Typography, Button, Input, Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextareaAutosize
} from "@mui/material";
import { useAtom } from "jotai";

import { agentDialogOpened } from "./agent";
import "./AboutDialog.css";


function AgentDialogContent() {
  /// const xxx = useState();

  return (
    <Box>
      <Typography>角色模板</Typography>
      <Box>
        <Button>台湾女友</Button> |
        <Button>土豆子</Button> |
        <Button>English Tutor</Button> |
        <Button>好奇小男孩</Button> |
        <Button>汪汪队队长</Button>
      </Box>
      
      <Typography>助手昵称</Typography>
      <Input value="小智" />
      
      <Typography>角色音色</Typography>
      <Input value="弯弯小何" />

      <Typography>角色介绍</Typography>
      <TextareaAutosize
        minRows={4} maxRows={4}
        value="我是一个智能助手，我非常智能，..............."
        spellCheck={false}
        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
      />
      <Typography className="char-count">123/2000</Typography>

      <Typography>记忆体</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography component="span">当前记忆 (每次对话后重新生成)</Typography>
        <Button>清除记忆</Button>
      </Box>
      <TextareaAutosize
        minRows={4} maxRows={4}
        value="有人和小智讨论了........"
        spellCheck={false}
        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
      />
      <Typography className="char-count">234/2000</Typography>

      <Typography>语言模型</Typography>
      <Select value={"doubao"}>
        <MenuItem value="doubao">Doubao (内容完善)</MenuItem>
        <MenuItem value="deepseek">DeepSeek (性格丰富)</MenuItem>
        <MenuItem value="qwen">Qwen (响应快速)</MenuItem>
      </Select>
    </Box>
  )
}


export interface AgentDialogProp { 

}


// 新建或修改 agent
export function AgentDialog(props: AgentDialogProp) {
  const [opened, setAgentDialog] = useAtom(agentDialogOpened);
  
  const close_dialog = () => {
    setAgentDialog(false);
  };

  const save_and_close = () => {
    console.info(`todo: create/update agent ...`)
    setAgentDialog(false);
  };

  return (
    <Dialog open={opened} fullWidth maxWidth="lg">
      <DialogTitle>新建智能体 or 配置角色 '小智'</DialogTitle>
      <DialogContent>
        <AgentDialogContent />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={close_dialog}>取消</Button>
        <Button variant="outlined" onClick={save_and_close}>保存</Button>
      </DialogActions>
    </Dialog>
  )
}
