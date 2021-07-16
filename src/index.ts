export type PartialStoreListener<T, K extends keyof T> = (arg: T[K]) => void;

export function createStore<StoreType extends Record<string, unknown>>(initialState: StoreType) {
    type StoreKeys = keyof StoreType;

    const storeKeys = Object.keys(initialState) as StoreKeys[];

    // FIXME: Don't really like `reduce` when creating an object..
    const listeners: {
        [K in StoreKeys]: PartialStoreListener<StoreType, K>[]
    } = storeKeys.reduce((acc, key) => {
        acc[key] = [];
        return acc;
    }, {} as {
        [K in StoreKeys]: PartialStoreListener<StoreType, K>[]
    });

    const store = initialState;

    function unsubscribe<K extends StoreKeys>(key: K, cb: PartialStoreListener<StoreType, K>) {
        listeners[key].splice(listeners[key].indexOf(cb as PartialStoreListener<StoreType, StoreKeys>)>>>0, 1);
    }

    function triggerKeyListeners(newStore: Partial<StoreType>) {
        for (const key of Object.keys(newStore) as StoreKeys[]) {
            for (const listener of listeners[key]) {
                const data = newStore[key] as StoreType[typeof key];
                (listener as PartialStoreListener<StoreType, StoreKeys>)(data);
            }
        }
    }

    return {
        Store: store as Readonly<StoreType>,
        subscribe<K extends StoreKeys>(key: K, cb: PartialStoreListener<StoreType, K>) {
            listeners[key].push(cb as PartialStoreListener<StoreType, StoreKeys>);
            return () => unsubscribe(key, cb);
        },
        updateStore(newStore: Partial<StoreType>) {
            triggerKeyListeners(newStore);
            Object.assign(store, newStore);
        }
    }
}
