import { atom } from "jotai";
import { CustomEventEmitter } from "../utils/CustomEventEmitter";

// Define the event types.
type Events = {
  board_set: any;
};

export interface MessageItemType {
  role: string;
  content: string;
  id: string;       // unique id
}

let _WARE_id = 1;

export class MessageWarehouse extends CustomEventEmitter<Events> {
  public readonly _id = _WARE_id++;
  
  public readonly messages = atom<MessageItemType[]>([]);

  public readonly tokensUsage = atom<MessageWarehouse.TokensUsage>({
    total: 0,
    prompt: 0,
    completion: 0,
  });

  // 一次执行的详细工具调用步骤.
  public readonly steps = atom<any[]>([]);

}

export namespace MessageWarehouse {
  export type TokensUsage = {
    total: number;
    prompt: number;
    completion: number;
  }
}
