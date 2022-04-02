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
http.listen(3000);
var io = new socket_io_1.Server(http, { pingTimeout: 120000, pingInterval: 5000, cors: { origin: "*" }, allowEIO3: true });
var rooms = new Map();
app.use(express.static('client/public'));
console.log('JEAH');
io.on("connection", function (socket) {
    console.log('Somebody Connected');
    socket.on('foo', function () {
        socket.emit('bar', 'Hello from express :)');
    });
    socket.on('create Room', function (uuid) {
        // später noch überprüfen ob es die schon gibt
        var roomID = (1000000 + (0, utils_1.getRandomNumber)(8999999)).toString();
        socket.join(roomID.toString());
        rooms.set(roomID, new room_1.Room(roomID, uuid));
        socket.emit('room created', { roomID: roomID });
        console.log('room Created', roomID);
    });
    socket.on("join Room", function (msg) {
        console.log(msg);
        var room = msg.rid;
        var player = msg.pid;
        var socketid = msg.sid;
        if (rooms.has(room)) {
            // rooms.get(room).controlTimer({ time: 20 })
            rooms.get(room).addPlayer(player, socketid);
            socket.join(room);
            socket.emit('joined room', { roomID: room });
        }
        else {
            socket.emit('roomNotAvailableError');
        }
    });
    socket.on('message', function (msg) {
        io.to(msg.room).emit('message', { text: msg.text });
    });
    socket.on('getBibleProps', function (msg) {
        var props = rooms.get(msg.rid).getBibleProps();
        socket.emit('bibleProps', props);
    });
    socket.on('getVerse', function (msg) {
        var verse = rooms.get(msg.rid).getCurrentVerse();
        socket.to(msg.rid).emit('sendVerse', verse);
    });
    socket.on('sendGuess', function (msg) {
        console.log('Got guess \n', msg);
        var res = rooms.get(msg.rid).handleGuess(msg.pid, msg.guess);
        socket.emit('guessProcessed', res);
    });
    //TODO: add that just admin can do this
    socket.on('startVerse', function (msg) {
        console.log(msg.rid);
        var verse = rooms.get(msg.rid).startVerse();
        // socket.emit('startedVerse', verse)
        io["in"](msg.rid).emit('startedVerse', verse);
        // socket.broadcast.to(msg.rid).emit('startedVerse', verse)
    });
    //TODO: add that just admin can do this
    socket.on('finishVerse', function (msg) {
        var res = rooms.get(msg.rid).finishVerse();
        io["in"](msg.rid).emit('finishedVerse', res);
    });
    //TODO: add that just admin can do this
    socket.on('setPlaylist', function (msg) {
        console.log(msg.playlist);
        rooms.get(msg.rid).loadPlaylist(msg.playlist, true);
    });
    //TODO: add that just admin can do this
    socket.on('stopPlaylist', function (msg) {
        rooms.get(msg.rid).pausePlaylist();
    });
    //TODO: add that just admin can do this
    socket.on('stopPlaylist', function (msg) {
        rooms.get(msg.rid).continuePlaylist();
    });
});
// http.listen(3000);
function getIO() {
    return io;
}
exports.getIO = getIO;
