# @weedzcokie/store

[![npm (scoped)](https://img.shields.io/npm/v/@weedzcokie/store?style=for-the-badge)](https://www.npmjs.com/package/@weedzcokie/store)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@weedzcokie/store?style=for-the-badge)](https://www.npmjs.com/package/@weedzcokie/store)

## Usage

`store.ts`:

```typescript
// Setup store
import { createStore } from "@weedzcokie/store";
type StoreType = {
    msg: string
};

const store = createStore<StoreType>({
    msg: ""
});
type StoreKeys = keyof StoreType;

// Optionally, export `Store` and `updateStore`:
export const Store = store.Store;
export const updateStore = store.updateStore;

// Use store
store.subscribe("msg", msg => {
    console.log(`new message: ${msg}`);
});

store.updateStore({
    msg: "Hello, world!"
});
```

### Preact component

```typescript
import { createStore, PartialStoreListener } from "@weedzcokie/store";

// Create store as in `store.ts`.

export abstract class StoreComponent<P = unknown, S = unknown> extends Component<P, S> {
    listeners: Array<() => void> = [];

    listen<T extends StoreKeys>(key: T, cb: PartialStoreListener<StoreType, T>) {
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
        this.listen("msg", msg => {
            console.log(msg);
            this.forceUpdate();
        });
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
            <p>{Store.msg}</p>
        );
    }
}
```
