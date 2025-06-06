import Store from "electron-store";
import { StoreType } from "../shared/config-type";


// 已知此 store 存放于 C:\Users\<usename>\AppData\Roaming\aigx5\config.json

export const store = new Store<StoreType>({
  // 这里给出一个默认的.
  defaults: {
    basic: {
      hello: 'hello, aigx5!'
    },
    llm: {
      doubao: {
        url: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: '',           // 需要用户给出
        model: '',            // 需要用户给出
      },
      doubao_vision: {
        url: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: '',           // 需要用户给出
        model: '',            // 需要用户给出
      }
    },
  }
});


export function getBasicConfigs() {
  

  return store.get('basic');
}
