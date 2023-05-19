import { createStore } from "../../src";
import { useEffect, useState } from "preact/hooks";

interface User {
    id: number
    name: string
}

type StoreType = {
    user: null | User;
};
type StoreKeys = keyof StoreType;

export const store = createStore<StoreType>({
    user: null,
});

export function useStore<T extends StoreKeys>(keys: T[]) {
    const [_s, set] = useState(false);
    useEffect(() => {
        const update = (_store: StoreType[T], _key: string) => {
            set(current => !current);
        };
        const listeners = keys.map(key => store.subscribe(key, update));

        return () => {
            for (const unsubscribe of listeners) {
                unsubscribe();
            }
        };
    }, []);

    return { data: Store as Pick<StoreType, T> };
}

export const Store = store.Store;
