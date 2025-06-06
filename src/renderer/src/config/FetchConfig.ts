import { StoreType } from "@shared/config-type";

export async function fetchConfig() {
  const cfg: StoreType = await window.electron.ipcRenderer.invoke('get-store');
  return cfg;
}

export async function saveConfig(config: StoreType) {
  await window.electron.ipcRenderer.invoke('set-store', config);
}
