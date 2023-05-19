import { store } from "./store";

export function userLogin() {
    store.updateStore("user", {
        id: 1,
        name: "User",
    });
}

export function userLogout() {
    store.updateStore("user", null);
}
