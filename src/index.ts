export type PartialStoreListener<T, K extends keyof T> = (arg: T[K], key: K) => void;

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

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

class Store<StoreType extends Record<string, unknown>, StoreKeys extends keyof StoreType = keyof StoreType> {
    #listeners: {
        [K in StoreKeys]: PartialStoreListener<StoreType, StoreKeys>[]
    };
    #store: StoreType;
    Store: Readonly<StoreType>;

    constructor(initialState: StoreType) {
        const keys = Object.keys(initialState) as StoreKeys[];
        this.#listeners = keys.reduce((acc, key) => {
            acc[key] = [];
            return acc;
        }, {} as {
            [K in StoreKeys]: PartialStoreListener<StoreType, StoreKeys>[]
        });
        this.#store = initialState;
        this.Store = this.#store;
    }

    unsubscribe<K extends StoreKeys>(key: K, cb: PartialStoreListener<StoreType, K>) {
        this.#listeners[key].splice(this.#listeners[key].indexOf(cb as PartialStoreListener<StoreType, StoreKeys>)>>>0, 1);
    }

    #triggerKeyListener<K extends StoreKeys>(key: K, newData: StoreType[K]) {
        for (const listener of this.#listeners[key]) {
            (listener as PartialStoreListener<StoreType, StoreKeys>)(newData, key);
        }
    }

    subscribe<K extends StoreKeys>(key: K, cb: PartialStoreListener<StoreType, K>) {
        this.#listeners[key].push(cb as PartialStoreListener<StoreType, StoreKeys>);
        return () => this.unsubscribe(key, cb);
    }
    updateStore<K extends StoreKeys>(key: K, newData: StoreType[K]) {
        this.#triggerKeyListener(key, newData);
        this.#store[key] = newData;
    }
    triggerStoreUpdate<K extends StoreKeys>(key: K) {
        this.#triggerKeyListener(key, this.#store[key]);
    }
    mergeUpdateStore(partialStoreItem: DeepPartial<StoreType>) {
        for (const key of Object.keys(partialStoreItem) as StoreKeys[]) {
            this.#triggerKeyListener(key, partialStoreItem[key] as StoreType[typeof key]);
        }
        deepMerge(partialStoreItem, this.#store);
    }
}

export function createStore<StoreType extends Record<string, unknown>, StoreKeys extends keyof StoreType = keyof StoreType>(initialState: StoreType) {
    return new Store<StoreType>(initialState);
}
