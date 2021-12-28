import * as express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Player, PlaylistElem } from "./datatypes";
import { Room } from "./room";
import { getRandomNumber } from "./utils";

const app = express();
const http = createServer(app);
const io = new Server(http, {pingTimeout: 120000, pingInterval: 5000});
var rooms = new Map<string, Room>()

app.use(express.static('public'))

console.log('JEAH')

io.on("connection", (socket) => {
  socket.on('create Room', () => {
      // später noch überprüfen ob es die schon gibt
      var roomID: string = getRandomNumber(10000).toString()
      socket.join(roomID.toString())
      socket.emit('room created', {roomID: roomID})
      rooms.set(roomID, new Room(roomID))
  })

  socket.on("join Room", (msg: {rid: string, pid: string, sid: string}) => {
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

  socket.on('message', (msg: {room: string, text: string}) => {
      io.to(msg.room).emit('message', {text: msg.text})
  })
});

http.listen(3000);

export function getIO() {
    return io
}