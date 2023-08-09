# @weedzcokie/store

[![npm (scoped)](https://img.shields.io/npm/v/@weedzcokie/store?style=for-the-badge)](https://www.npmjs.com/package/@weedzcokie/store)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@weedzcokie/store?style=for-the-badge)](https://www.npmjs.com/package/@weedzcokie/store)

## Usage

A full example can be found in [example](https://github.com/weedz/store/tree/master/example).

`store.ts`:

```typescript
// Setup store
import { createStore } from "@weedzcokie/store";
type StoreType = {
    counter: number
};

const store = createStore<StoreType>({
    counter: 0
});
type StoreKeys = keyof StoreType;

// Optionally, export `Store` and `updateStore`:
export const Store = store.Store;
export const updateStore = store.updateStore;

// Use store
store.subscribe("counter", count => {
    console.log(`current count: ${count}`);
});

store.updateStore({
    counter: 1
});
```

### Preact component

```typescript
import { createStore, PartialStoreListener } from "@weedzcokie/store";

// Create store as in `store.ts`.

export abstract class StoreComponent<P = unknown, S = unknown> extends Component<P, S> {
    listeners: Array<() => void> = [];

    listen<T extends StoreKeys>(key: T, cb: PartialStoreListener<StoreType, T> = () => this.forceUpdate()) {
        this.listeners.push(store.subscribe(key, cb));
    }

    componentWillUnmount() {
        for (const unsubscribe of this.listeners) {
            unsubscribe();
        }
    }
}
```

Can now be used as:

```tsx
import { StoreComponent, Store } from "./store";
export default class App extends StoreComponent {
    componentDidMount() {
        this.listen("counter");
    }
    // ...
    
    // If you need to use `componentWillUnmount`, do not forget to call `super.componentWillUnmount()`
    componentWillUnmount() {
        super.componentWillUnmount();
        // ...
    }

    // store is available from the exported Store variable.
    render() {
        return (
            <p>Current count: {Store.counter}</p>
            <button onClick={() => updateStore({counter: Store.counter + 1})}>Increment count</button>
        );
    }
}
```

### Hooks

Or using hooks:
```tsx
import { Store, updateStore } from "./store";

// Create store as in `store.ts`.

export function useStore<T extends StoreKeys>(keys: T[]) {
    const [s, set] = useState(false);

    useEffect(() => {
        const update = () => set(current => !current);
        const listeners = keys.map(key => store.subscribe(key, update));

        return () => {
            for (const unsubscribe of listeners) {
                unsubscribe()
            }
        }
    }, []);

    return { data: Store as Pick<StoreType, T> };
}

function App() {
    useStore(["counter"]);

    return (
        <p>Current count: {Store.counter}</p>
        <button onClick={() => updateStore({counter: Store.counter + 1})}>Increment count</button>
    );
}
```

#### Hooks with "initializers"

`./store.ts`:
```tsx
type StoreType = {
    user: null | StoredUser
    favorites: Set<number>
}
type StoreKeys = keyof StoreType;

const store = createStore<StoreType>({
    user: null,
    favorites: new Set(),
});

const initFnLoaders: Map<string, Promise<unknown>> = new Map();
const initFn: Partial<{
    [K in StoreKeys]: () => void
}> = {
    user: async () => {
        // Check if logged in
        const user = localStorage.getItem("user");
        if (user) {
            const res = await fetch("/api/auth");

            if (!res || res.status !== 200) {
                localStorage.removeItem("user");
                store.updateStore({user: null});
                return;
            }

            store.updateStore({user: user})
        }
    },
}

export function useStore<T extends StoreKeys>(keys: T[]) {
  const [_s, set] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const propsToLoad: Set<string> = new Set();
    const update = () => set(current => !current);
    const listeners = keys.map((key) => store.subscribe(key, update));

    for (const key of keys) {
      let promise = initFnLoaders.get(key);
      if (promise) {
        propsToLoad.add(key);
        promise.then(() => {
          propsToLoad.delete(key);
          setLoading(!!propsToLoad.size);
        });
      }

      const fn = initFn[key];
      if (fn) {
        propsToLoad.add(key);
        promise = fn().then(() => {
          initFnLoaders.delete(key);
          propsToLoad.delete(key);
          setLoading(!!propsToLoad.size);
        });

        initFnLoaders.set(key, promise);

        delete initFn[key];
      }
    }

    if (propsToLoad.size === 0) {
      setLoading(false);
    }

    return () => {
      for (const unsubscribe of listeners) {
        unsubscribe();
      }
    };
  }, []);

  return { loading, data: Store as Pick<StoreType, T> };
}
```

`./profile.tsx`:
```tsx
export default ProfilePage() {
    const {loading, data} = useStore(["user"]);
    if (loading || !data.user) {
        return null;
    }

    return <Profile />
}
```
