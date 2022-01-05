"use strict";
exports.__esModule = true;
exports.getIO = void 0;
var express = require("express");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var room_1 = require("./room");
var utils_1 = require("./utils");
var app = express();
var http = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(http, { pingTimeout: 120000, pingInterval: 5000 });
var rooms = new Map();
app.use(express.static('public'));
console.log('JEAH');
io.on("connection", function (socket) {
    socket.on('create Room', function () {
        // später noch überprüfen ob es die schon gibt
        var roomID = (0, utils_1.getRandomNumber)(10000).toString();
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
    socket.on('getVerse', function (msg) {
        var verse = rooms.get(msg.rid).getCurrentVerse();
        socket.to(msg.rid).emit('sendVerse', verse);
    });
    socket.on('sendGuess', function (msg) {
        var res = rooms.get(msg.rid).handleGuess(msg.pid, msg.guess);
        socket.to(msg.rid).emit('guessProcessed', res);
    });
    socket.on('startVerse', function (msg) {
        var verse = rooms.get(msg.rid).startVerse();
        socket.to(msg.rid).emit('startedVerse', verse);
        socket.broadcast.to(msg.rid).emit('startedVerse', verse);
    });
    //TODO: add that just admin can do this
    socket.on('finishVerse', function (msg) {
        var res = rooms.get(msg.rid).finishVerse();
        io["in"](msg.rid).emit('finishedVerse', res);
    });
});
http.listen(3000);
function getIO() {
    return io;
}
exports.getIO = getIO;
