// import Versions from './components/Versions'

import { useMemo, useState, useEffect } from 'react';
import { ChatPane } from './components/ChatPane';
import { SketchpadStoreProvider } from "./store/SketchpadProvider"
import { MessageWarehouseProvider } from './store/MessageWarehouseProvider';
import { JXGraph } from './components/JXGraph';
import { GraphDebugger } from './components/debug/GraphDebugger';

import { fetchLLMConfig } from './ai/llm-config';

export function GraphApp() {
  // 在这里调用一些异步的初始化函数, 并在初始化之后, 才渲染组件.
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cfg = await fetchLLMConfig();
        setIsLoaded(true);
        // console.info('LLM config loaded successfully: ', cfg);
      } catch (error) {
        console.error('Failed to load LLM config', error);
      }
    };

    fetchData();
  }, []);

  return (
    isLoaded
      ? <GraphAppInner />
      : <div>Loading...</div>
  )
}

function GraphAppInner() {
  return useMemo(() => (
    <SketchpadStoreProvider>
      <MessageWarehouseProvider>
        <div className="flex flex-row">
          <div style={{ width: '610px' }}>
            <JXGraph />
            <GraphDebugger />
          </div>
          <div style={{ width: 'calc(100vw - 610px)' }}>
            <ChatPane />
          </div>
        </div>
      </MessageWarehouseProvider>
    </SketchpadStoreProvider>
  ), []);
}