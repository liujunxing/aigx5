export const test_ipc = () => {
  const ipcRenderer = window.electron.ipcRenderer;
  console.info(`test_ipc: `, { window_electron: window.electron, ipcRenderer });

  ipcRenderer.send('ping');
};

