import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Player, Playlist } from "./datatypes";
import { Room } from "./room";

const app = express();
const http = createServer(app);
const io = new Server(http, {pingTimeout: 120000, pingInterval: 5000});
var rooms = new Map<string, Room>()

app.use(express.static('public'))

console.log('JEAH')

io.on("connection", (socket) => {
  socket.on('create Room', msg => {
      // später noch überprüfen ob es die schon gibt
      var roomID: string = getRandomInt(10000).toString()
      socket.join(roomID.toString())
      socket.emit('room created', {roomID: roomID})
      rooms.set(roomID, new Room(roomID))
  })

  socket.on("join Room", msg => {
      var room: string = msg.rid
      var player: string = msg.pid
      var socketid : string = msg.sid
      if(rooms.has(room)) {
          rooms.get(room).controlTimer({time: 20})
          rooms.get(room).addPlayer(player, socketid)
          socket.join(room)
          socket.emit('joined room', {roomID: room})
      }
  })

  socket.on('message', msg => {
      io.to(msg.room).emit('message', {text: msg.text})
  })
});

http.listen(3000);

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max)
}

export function getIO() {
    return io
}