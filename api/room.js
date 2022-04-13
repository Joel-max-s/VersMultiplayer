"use strict";
// Histroy vernünftig implementieren
// Timer verbessern -> so das die duration beim vers mit kommt
exports.__esModule = true;
exports.Room = void 0;
var datatypes_1 = require("./datatypes");
var server_1 = require("./server");
var utils_1 = require("./utils");
var verses_1 = require("./verses");
var Room = /** @class */ (function () {
    function Room(id, admin) {
        this.players = new Map();
        this.selectedBooks = (0, utils_1.generateBooksList)();
        this.countdown = null;
        this.id = id;
        this.admin = admin;
        this.vh = new verses_1.VerseHandler();
        this.bibleP = this.vh.generateBibleProps();
    }
    Room.prototype.startVerse = function () {
        this.resetTipPoints();
        var time = this.vh.generateVerse();
        this.controlTimer({ time: time });
        return { verse: this.vh.verse.text, time: time };
    };
    Room.prototype.stopVerse = function () {
        this.players.forEach(function (player) {
            player.points += player.currentTipPoints;
        });
    };
    // wenn noch kein Timer gestartet wurde einen starten
    // wenn der Timer bereits läuft ihn erhöhen oder verringern, bei bedarf auch stoppen
    Room.prototype.controlTimer = function (_a) {
        var _b = _a.time, time = _b === void 0 ? 0 : _b, _c = _a.endTimer, endTimer = _c === void 0 ? false : _c;
        if (this.countdown === null && time > 0) {
            console.log(time);
            this.startTimer(time);
            return;
        }
        else if (this.countdown != null) {
            endTimer ? this.stopTimer() : this.changeTimer(time);
        }
    };
    Room.prototype.addPlayer = function (id, sid) {
        if (this.players.has(id)) {
            this.players.get(id).socketid = sid;
        }
        this.players.set(id, new datatypes_1.Player(id, sid));
    };
    Room.prototype.removePlayer = function (player) {
        this.players["delete"](player.id);
    };
    Room.prototype.finishVerse = function () {
        var _this = this;
        var results = [];
        this.controlTimer({ endTimer: true });
        this.players.forEach(function (player) {
            if (player.allowedToSend) {
                player.allowedToSend = false;
                player.history.push({ time: -1, guess: [-1, -1, -1] });
            }
            player.points += player.currentTipPoints;
            var resElem = {
                "name": player.name,
                "points": player.points,
                "currentTipPoints": player.currentTipPoints
            };
            var playerElem = {
                "points": player.currentTipPoints,
                "rightAnswer": _this.vh.verse,
                // @ts-ignore
                "guess": player.history.at(-1)
            };
            // abgleich ob antwort richtig war
            (0, server_1.getIO)().to(player.socketid).emit('singleFinishVerseResult', playerElem);
            results.push(resElem);
        });
        return results;
    };
    Room.prototype.startTimer = function (time) {
        var _this = this;
        this.timeLeft = time;
        (0, server_1.getIO)()["in"](this.id).emit('timer', this.timeLeft);
        this.countdown = setInterval(function () {
            if (_this.timeLeft > 0)
                _this.timeLeft--;
            else if (_this.timeLeft <= 0) {
                _this.stopTimer();
                _this.finishVerse();
                //Test
                console.log(_this.players);
            }
        }, 1000);
        // this.countdown = setInterval(() => {
        //     getIO().in(this.id).emit('timer', this.timeLeft)
        //     if (this.timeLeft > 0) this.timeLeft--
        //     else if (this.timeLeft <= 0) {
        //         this.stopTimer()
        //         // ergebnisse Senden
        //         //Test
        //         console.log(this.players)
        //     }
        // }, 1000)
    };
    Room.prototype.changeTimer = function (time) {
        if (this.timeLeft + time > 0)
            this.timeLeft += time;
    };
    Room.prototype.stopTimer = function () {
        clearInterval(this.countdown);
        this.countdown = null;
        this.timeLeft = 0;
    };
    Room.prototype.resetTipPoints = function () {
        this.players.forEach(function (player) {
            player.currentTipPoints = 0;
            player.allowedToSend = true;
        });
    };
    Room.prototype.getCurrentVerse = function () {
        var v = this.vh.verse.text;
        var verse = v != null ? v : "Aktuell ist noch kein Vers vorhanden";
        return (verse);
    };
    Room.prototype.getBibleProps = function () {
        return this.bibleP;
    };
    Room.prototype.handleGuess = function (playerId, guess) {
        var msg = "";
        var player = this.players.get(playerId);
        if (player.allowedToSend) {
            var points = this.vh.calculatePoints(guess);
            player.allowedToSend = false;
            // TODO: calculate time
            player.history.push({ time: -1, guess: guess });
            msg = this.vh.stringifyverseList(guess) + " wurde gesendet.";
        }
        else {
            // TODO: prüfung ob es eine history gibt um eventuelle Fehler zu vermeiden
            // @ts-ignore
            var verse = this.vh.stringifyverseList(player.history.at(-1));
            msg = verse + " wurde bereits gesendet. Nur der die erste Einsendung wird gewertet";
        }
        return msg;
    };
    Room.prototype.loadPlaylist = function (playlist, enablePlaylist) {
        if (enablePlaylist === void 0) { enablePlaylist = false; }
        this.vh.bible = (0, utils_1.getBible)(playlist.bible);
        this.vh.playlistElems = playlist.elems.entries();
        this.vh.playlistActive = enablePlaylist;
    };
    Room.prototype.pausePlaylist = function () {
        this.vh.playlistActive = false;
    };
    Room.prototype.continuePlaylist = function () {
        this.vh.playlistActive = true;
    };
    Room.prototype.setAvailableBooks = function (books) {
        this.vh.setAvailableBooks(books);
    };
    return Room;
}());
exports.Room = Room;
