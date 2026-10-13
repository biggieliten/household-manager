import Storage from "expo-sqlite/kv-store";
import { createJSONStorage } from "jotai/utils";

// Synchronous storage so persisted atoms have their saved value on first render.
export function createKvStorage<Value>() {
  return createJSONStorage<Value>(() => ({
    getItem: (key) => Storage.getItemSync(key),
    setItem: (key, value) => Storage.setItemSync(key, value),
    removeItem: (key) => {
      Storage.removeItemSync(key);
    },
  }));
}
