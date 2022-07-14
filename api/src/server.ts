import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Playlist } from "./datatypes";
import { Room } from "./room";
import { getRandomNumber } from "./utils";

const app = express();
const http = createServer(app);
http.listen(3000);
const io = new Server(http, { pingTimeout: 120000, pingInterval: 5000, cors: {origin: "*"}, allowEIO3: true});
const rooms = new Map<string, Room>()

app.use(express.static('public'))

console.log('JEAH')

io.on("connection", (socket) => {

    console.log('Somebody Connected')

    socket.on('foo', () => {
        socket.emit('bar', 'Hello from express :)')
    })

    socket.on('create Room', (uuid: string) => {
        // später noch überprüfen ob es die schon gibt
        var roomID: string = (1000000 + getRandomNumber(8999999)).toString()
        socket.join(roomID.toString())
        rooms.set(roomID, new Room(roomID, uuid))
        socket.emit('room created', { roomID: roomID })
        console.log('room Created', roomID)
    })

    socket.on("join Room", (msg: { rid: string, pid: string, sid: string, name?: string}) => {
        console.log(msg)
        var room: string = msg.rid
        var player: string = msg.pid
        var socketid: string = msg.sid
        if (rooms.has(room)) {
            console.log(`joining room ${room}`)
            // rooms.get(room).controlTimer({ time: 20 })
            rooms.get(room)!.addPlayer(player, socketid, msg.name)
            socket.join(room)
            socket.emit('joined room', { roomID: room })
            io.in(msg.rid).emit('finishedVerse', rooms.get(room)!.getPlayerStats())
            console.log('joined')
        }
        else {
            socket.emit('roomNotAvailableError')
        }
    })

    socket.on('message', (msg: { room: string, text: string }) => {
        io.to(msg.room).emit('message', { text: msg.text })
    })

    socket.on('getBibleProps', (msg: {rid: string}) => {
        const props = rooms.get(msg.rid)?.getBibleProps()
        socket.emit('bibleProps', props)
    })

    socket.on('getVerse', (msg: { rid: string }) => {
        const verse = rooms.get(msg.rid)?.getCurrentVerse()
        socket.emit('sendVerse', verse)
    })

    socket.on('sendGuess', (msg: { rid: string, pid: string, guess: [number, number, number] }) => {
        console.log('Got guess \n', msg)
        const res = rooms.get(msg.rid)?.handleGuess(msg.pid, msg.guess)
        console.log(res)
        socket.emit('guessProcessed', res)
    })

    //TODO: add that just admin can do this
    socket.on('startVerse', (msg: {rid: string}) => {
        console.log(msg.rid)
        const res = rooms.get(msg.rid)?.startVerse()
        io.in(msg.rid).emit('startedVerse', res)
    })

    //TODO: add that just admin can do this
    socket.on('finishVerse', (msg: {rid: string}) => {
        const res = rooms.get(msg.rid)?.finishVerse()
        io.in(msg.rid).emit('finishedVerse', res)
    })

    //TODO: add that just admin can do this
    socket.on('setPlaylist', (msg: {rid: string, playlist: Playlist}) => {
        console.log(msg.playlist)
        rooms.get(msg.rid)?.loadPlaylist(msg.playlist, true)
    })

    //TODO: add that just admin can do this
    socket.on('stopPlaylist', (msg: {rid: string}) => {
        rooms.get(msg.rid)?.pausePlaylist()
    })

    //TODO: add that just admin can do this
    socket.on('continuePlaylist', (msg: {rid: string}) => {
        rooms.get(msg.rid)?.continuePlaylist()
    })

    //TODO: add that just admin can do this
    socket.on('increaseTimer', (msg: {rid: string, time: number}) => {
        console.log(msg);
        rooms.get(msg.rid)?.controlTimer({time: msg.time})
    })

    //TODO: add that just admin can do this
    socket.on('stopTimer', (msg: {rid: string}) => {
        rooms.get(msg.rid)?.controlTimer({endTimer: true})
    })
});
// http.listen(3000);

export function getIO() {
    return io
}