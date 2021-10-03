"use strict";
exports.__esModule = true;
exports.getIO = void 0;
var express = require("express");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var room_1 = require("./room");
var app = express();
var http = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(http, { pingTimeout: 120000, pingInterval: 5000 });
var rooms = new Map();
app.use(express.static('public'));
console.log('JEAH');
io.on("connection", function (socket) {
    socket.on('create Room', function (msg) {
        // später noch überprüfen ob es die schon gibt
        var roomID = getRandomInt(10000).toString();
        socket.join(roomID.toString());
        socket.emit('room created', { roomID: roomID });
        rooms.set(roomID, new room_1.Room(roomID));
    });
    socket.on("join Room", function (msg) {
        var room = msg.rid;
        var player = msg.pid;
        var socketid = msg.sid;
        if (rooms.has(room)) {
            rooms.get(room).controlTimer({ time: 20 });
            rooms.get(room).addPlayer(player, socketid);
            socket.join(room);
            socket.emit('joined room', { roomID: room });
        }
    });
    socket.on('message', function (msg) {
        io.to(msg.room).emit('message', { text: msg.text });
    });
});
http.listen(3000);
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
function getIO() {
    return io;
}
exports.getIO = getIO;
