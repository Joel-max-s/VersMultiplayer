<script>
    import { User, socket, bible } from "../stores";
    import Button from "./Button.svelte";

    let num = null;
    let btnDisabled = true;
    let min = 1000000;
    let max = 9999999;
    let message;

    function getUUID() {
        if (localStorage.getItem("userID") === null) {
            //uuidv4() is right even if it thinks it is not
            const userID = uuidv4();
            localStorage.setItem("userID", userID);
        }
        return localStorage.getItem("userID");
    };

    const handleInput = () => {
        console.log(num);
        if (num < min || num > max) {
            message = `Game ID must be ${min.toString().length} characters`;
            btnDisabled = true;
        } else {
            message = null;
            btnDisabled = false;
        }
    };

    function handleJoinGame() {
        if (num >= min && num <= max) {
            console.log(num)
            const newUser = {
                id: getUUID(),
                username: 'TestUSer',
                type: 'user',
                roomID: num.toString()
            };
            User.update(() => newUser);
            $socket.emit('join Room', {rid: $User.roomID, pid: $User.id, sid: $socket.id})
            num = null;
        }
    }

    function handleCreateGame() {
        const uuid = getUUID()
        console.log(uuid);

        $socket.emit("create Room", uuid);
    }

    $socket.on("connect", () => {
        $socket.emit("foo");
    });

    $socket.on("bar", (msg) => {
        console.log(msg);
    });

    $socket.on("room created", (msg) => {
        console.log(msg.roomID);
        console.log(getUUID());
        const rid = msg.roomID;
        const adminUser = {
            loggedIn: true,
            id: getUUID(),
            type: "admin",
            roomID: rid,
        };
        User.update(() => adminUser);
    });

    $socket.on("joined room", (msg) => {
        console.log('joined Room', msg.roomID)
        $User.roomID = msg.roomID
        $User.loggedIn = true
        $socket.emit('getBibleProps', {rid: msg.roomID.toString()})
    });

    $socket.on("roomNotAvailableError", () => {
        console.log('roomNotAvailableError')
    });

</script>

<div>
    <header>
        <h2>CREATE A GAME</h2>
        <Button type="submit" on:click={() => handleCreateGame()}>
            create Game
        </Button>
    </header>

    <header>
        <h2>JOIN A GAME</h2>
    </header>

    <div class="input-group">
        <input
            type="number"
            bind:value={num}
            on:input={handleInput}
            placeholder="Game-PIN"
        />
        <Button
            disabled={btnDisabled}
            type="submit"
            on:click={() => handleJoinGame()}>join</Button
        >
    </div>
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
        display: flex;
        flex-direction: column;
        align-items: center;
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
