import { useAtom } from "jotai";
import { useMessageWarehouse } from "@renderer/store/MessageWarehouseProvider";
import { MessageItemType } from "@renderer/store/MessageWarehouse";
import "./message.css";


const DEBUG_messages = [
  { role: "user", content: "hello", id: "1" },
  { role: "assistant", content: "很高兴认识你", id: "2" },
];  


export function MessagesList() {
  const store = useMessageWarehouse();
  const [messages, _setMessages] = useAtom(store.messages);

  return (
    <div className="messages-list">
      {messages.map(item => <MessageItem key={item.id} item={item} />)}
    </div>
  )
}


interface MessageItem_Props {
  item: MessageItemType;
}

export function MessageItem({ item }: MessageItem_Props) {
  return (
    <div className="message-item" data-id={item.id}>
      <div className="message-role">{item.role}: </div>
      <div className="message-content">{item.content}</div>
    </div>
  )
}
