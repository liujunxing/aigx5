import { useAtom, atom } from "jotai";

import type { StoreType } from "@shared/config-type";


export const configAtom = atom<StoreType>({} as unknown as StoreType);
