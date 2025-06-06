import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import type { Board } from "jsxgraph"

interface SketchpadStoreType {
  board: Board | null;  // JXG board
  setBoard: (board: any) => void;
}

// Create the context
const SketchpadStoreContext = createContext<SketchpadStoreType | null>(null);

export const SketchpadStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [store, setStore] = useState(() => ({ board: null }));
  const setBoard = useCallback((board: any) => {
    setStore(prev => ({ ...prev, board }));
  }, []);
  console.info(`sketch-store: `, store);

  return (
    <SketchpadStoreContext.Provider value={{ ...store, setBoard }}>
      {children}
    </SketchpadStoreContext.Provider>
  );
};

export const useSketchpadStore = () => {
  const context = useContext(SketchpadStoreContext);
  if (!context) {
    throw new Error('useSketchpadStore() must be used within a Provider');
  }
  return context;
};

