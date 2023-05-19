import { render } from "preact";
import { useStore } from "./store";
import { userLogin, userLogout } from "./user";

function Navbar() {
    const {data} = useStore(["user"]);
    const items = data.user
        ? [
                <li>Hello, {data.user.name}</li>,
                <li><button onClick={userLogout} type="button">Logout</button></li>,
        ]
        : [
                <li><button onClick={userLogin} type="button">Login</button></li>,
        ];
    
    return (
        <ul>{items}</ul>
    )

}

function App() {
    return (
        <div>
            <Navbar />
        </div>
    );
}

render(<App />, document.body);
