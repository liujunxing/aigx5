import { ElectronAPI } from '@electron-toolkit/preload'
import { StoreType } from '@shared/config-type';

export class DesktopPlatform {
  public static readonly electron: ElectronAPI = window.electron;
  public static async invoke<T = any>(channel: string, ...args: any[]): Promise<T> {
    return DesktopPlatform.electron.ipcRenderer.invoke(channel, ...args);
  }

  public static async getStore() {
    return DesktopPlatform.invoke('get-store') as Promise<StoreType>;
  }


}
