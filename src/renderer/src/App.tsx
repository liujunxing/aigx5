// import Versions from './components/Versions'

import { useState } from 'react';
import { Button } from '@mui/material';
import { GraphApp } from "./GraphApp";
import { FabricApp } from "./FabricApp";
import { ConfigDialog } from './config';

import { configOpenedAtom } from "./store/app-atoms";
import { useAtom } from 'jotai';

export function App() {
  const [app, setApp] = useState('graph');
  // 改用 atom
  const [configOpened, setConfigOpened] = useAtom(configOpenedAtom);

  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <Button variant='contained' onClick={() => setApp('graph')}>Graph 应用</Button>
        &nbsp;
        <Button variant='contained' onClick={() => setApp('fabric')}>(试题应用)</Button>
        &nbsp;
        {/* <Button variant='outlined' onClick={test_memo}>Test Memo</Button> */}
        <Button variant='outlined' onClick={() => { setConfigOpened(true) }}>配置</Button>
      </div>
      <div style={{ display: app === 'graph' ? 'block' : 'none' }}>
        <GraphApp />
      </div>
      <div style={{ display: app === 'fabric' ? 'block' : 'none' }}>
        {app === 'fabric' ? <FabricApp /> : null }
      </div>

      { /* 配置对话框 */ }
      {configOpened ? <ConfigDialog /> : null}
    </div>
  )
}
