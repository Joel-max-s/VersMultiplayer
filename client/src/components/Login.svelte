<script>
    import { User } from "../stores";
    import Button from "./Button.svelte";

    let text = "";
    let btnDisabled = true;
    let min = 2;
    let message;

    const handleInput = () => {
        console.log(text.trim())
        if (text.trim().length < min) {
            message = `Username must be at least ${min} characters`;
            btnDisabled = true;
        } else {
            message = null;
            btnDisabled = false;
        }
    };

    const handleSubmit = (test) => {
        console.log(test)
        if (text.trim().length >= min) {
            const newUser = {
                // id: uuidv4(),
                loggedIn: true,
                username: text,
            };
            User.update(() => newUser);
            text = "";
        }
    };

    const socket = io()
    
    socket.on("connect", () => {
        socket.emit('foo')
    })
    
    socket.on("bar", (msg) => {
        console.log(msg)
    })
</script>

<div>
    <header>
        <h2>HELLO TEST2</h2>
    </header>
    <form on:submit|preventDefault={handleSubmit}>
        <div class="input-group">
            <input
                type="text"
                bind:value={text}
                on:input={handleInput}
                placeholder="Username"
            />
            <Button disabled={btnDisabled} type="submit">create</Button>
            <Button disabled={btnDisabled} type="submit">join</Button>
        </div>
    </form>
    {#if message}
        <div class="message">
            {message}
        </div>
    {/if}
</div>

<style>
    header {
        max-width: 400px;
        margin: auto;
    }
    header h2 {
        font-size: 22px;
        font-weight: 600;
        text-align: center;
    }
    .input-group {
        display: flex;
        flex-direction: row;
        border: 1px solid #ccc;
        padding: 8px 10px;
        border-radius: 8px;
        margin-top: 15px;
        gap: 3px;
    }
    input {
        flex-grow: 2;
        border: none;
        font-size: 16px;
    }
    input:focus {
        outline: none;
    }
    .message {
        padding-top: 10px;
        text-align: center;
        color: rebeccapurple;
    }
</style>
