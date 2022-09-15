export type PartialStoreListener<T, K extends keyof T> = (arg: T[K]) => void;

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

export interface CreatedStore<StoreType extends Record<string, unknown>, StoreKeys extends keyof StoreType> {
    Store: Readonly<StoreType>
    subscribe: <K extends StoreKeys>(key: K, cb: PartialStoreListener<StoreType, K>) => () => void
    updateStore: (newStore: Partial<StoreType>) => void
    mergeUpdateStore: (partialStoreItem: DeepPartial<StoreType>) => void
}

function deepMerge(source: Record<string, unknown> | {}, target: Record<string, unknown>) {
    for (const [key, value] of Object.entries(source)) {
        if (value !== null && typeof value === "object") {
            if (target[key] === undefined) {
                target[key] = value;
            } else {
                deepMerge(value, target[key] as Record<string, unknown>)
            }
        } else {
            target[key] = value;
        }
    }
    return target;
}

export function createStore<StoreType extends Record<string, unknown>>(initialState: StoreType): CreatedStore<StoreType, keyof StoreType> {
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

    function triggerKeyListeners(newStore: DeepPartial<StoreType>) {
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
        },
        mergeUpdateStore(partialStoreItem: DeepPartial<StoreType>) {
            triggerKeyListeners(partialStoreItem);
            deepMerge(partialStoreItem, store);
        },
    }
}
