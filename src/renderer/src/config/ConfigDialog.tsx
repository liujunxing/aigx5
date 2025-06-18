import { useState, useEffect, memo } from "react";
import { useAtom } from "jotai";
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, Tabs, Tab, DialogActions } from "@mui/material";

import { configOpenedAtom } from "../store/app-atoms";
import { configAtom } from "./ConfigValue";
import { AgentTab } from "./AgentTab";
import { PromptTab } from "./PromptTab";
import { fetchConfig, saveConfig } from "./FetchConfig";
import { LLMTab } from "./LLMTab";
import { notifyConfigChange } from "./config-change-notify";



export function ConfigDialog() {
  const [_configValue, setConfigValue] = useAtom(configAtom);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function _run() {
      // 需要异步加载配置信息, 理论上这里拿到的是一个新的副本.
      const config = await fetchConfig();
      // const config2 = await fetchConfig();    // 例如我们比较一下 config, config2 应该内容一样, 但不是同一个对象.
      // console.info(`config:`, { config });

      setConfigValue(config);
      setIsLoaded(true);
    }

    _run();
  }, []);

  return (isLoaded
    ? <ConfigDialogContent />
    : <Typography>Loading...</Typography>
  )
}

function _ConfigDialogContent() {
  const [currentTab, setCurrentTab] = useState('tab1');
  const [configOpened, setConfigOpened] = useAtom(configOpenedAtom);
  const [configValue, _setConfigValue] = useAtom(configAtom);

  const handleChangeTab = (_, tab) => {
    // console.info("handleChangeTab", { tab });
    setCurrentTab(tab);
  };

  const onSave = () => { 
    async function _run() {
      console.info("todo: on-save: ", { configValue });
      // 1. save
      await saveConfig(configValue);
      // 2. notify 
      await notifyConfigChange();

      // 3. close dialog 
      setConfigOpened(false);
    }
    _run();
  };
  const onCancel = () => {
    console.info("on-cancel");
    setConfigOpened(false);
  };


  return (
    <Dialog open={configOpened} onClose={onCancel} fullWidth maxWidth="xl">
      <DialogTitle>Config Dialog</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',   // Keep row to allow vertical tabs on the left
            width: '100%',
            minHeight: '62vh',
            // borderBottom: 1,
            // borderColor: 'divider',
            marginBottom: '20px',
          }}
        >
          <Tabs value={currentTab} onChange={handleChangeTab}
            orientation="vertical"  // This makes tabs vertical
            sx={{
              borderRight: 1,
              borderColor: 'divider',
              minWidth: '100px',   // Set a fixed width for the tab menu
            }}
          >
            <Tab value="tab1" label="大模型" />
            <Tab value="tab2" label="智能体" />
          </Tabs>

          <Box
            sx={{ marginLeft: 2, flex: 1 }}
          >
            {currentTab === 'tab1' && <LLMTab />}
            {currentTab === 'tab2' && <AgentTab />}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

const ConfigDialogContent = memo(_ConfigDialogContent);
