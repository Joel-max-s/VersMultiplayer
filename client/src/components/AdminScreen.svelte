<script>
import { User, verse, socket } from "../stores";
console.log($User.roomID)

//probably refactor
$socket.on('startedVerse', (v) => {
    console.log(v)
    $verse = v
})
</script>

<p>{$verse}</p>
<button on:click={() => {$socket.emit('startVerse', {rid: $User.roomID})}}>vers starten</button>
<button on:click={() => {$socket.emit('finishVerse', {rid: $User.roomID})}}>vers beenden</button>
