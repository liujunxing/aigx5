import { createContext, useContext, ReactNode, useState } from "react";
import { MessageWarehouse } from "./MessageWarehouse";


// Create the context
const MessageWarehouseContext = createContext<MessageWarehouse | null>(null);

// Create a custom hook to use the context 
export const useMessageWarehouse = () => {
  const context = useContext(MessageWarehouseContext);
  if (!context) {
    throw new Error('useMessageWarehouse() must be used within a Provider');
  }
  return context;
};

// Create the provider component 
export const MessageWarehouseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wares] = useState(() => new MessageWarehouse());
  // console.info(`wares: `, wares);

  return (
    <MessageWarehouseContext.Provider value={wares}>
      {children}
    </MessageWarehouseContext.Provider>
  );
};
