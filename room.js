"use strict";
// alle Spieler tracken
// die Verse Senden
// sich um die Zeit kümmern
// beim Zeitablauf ergebnisse absenden
exports.__esModule = true;
exports.Room = void 0;
var datatypes_1 = require("./datatypes");
var server_1 = require("./server");
var utils_1 = require("./utils");
var verses_1 = require("./verses");
var Room = /** @class */ (function () {
    function Room(id) {
        this.players = new Map();
        this.selectedBooks = (0, utils_1.generateBooksList)();
        this.countdown = null;
        this.id = id;
        this.vh = new verses_1.VerseHandler();
    }
    //TODO: build game loop
    Room.prototype.startVerse = function () {
        this.resetTipPoints();
        this.vh.generateVerse();
        return this.vh.verse.text;
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
        var results = [];
        this.controlTimer({ endTimer: true });
        this.players.forEach(function (player) {
            player.allowedToSend = false;
            player.points += player.currentTipPoints;
            var resElem = {
                "name": player.name,
                "points": player.points,
                "currentTipPoints": player.currentTipPoints
            };
            results.push(resElem);
            // TODO: send result
            // getIO().to(this.id).emit('tipp income', {eval})
        });
        // TODO: better solution, just points maybe
        // getIO().to(this.id).emit('finish verse', this.players)
        return results;
    };
    Room.prototype.startTimer = function (time) {
        var _this = this;
        this.timeLeft = time;
        this.countdown = setInterval(function () {
            (0, server_1.getIO)()["in"](_this.id).emit('timer', _this.timeLeft + ' Sekunden');
            if (_this.timeLeft > 0)
                _this.timeLeft--;
            else if (_this.timeLeft <= 0) {
                _this.stopTimer();
                // ergebnisse Senden
                //Test
                console.log(_this.players);
            }
        }, 1000);
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
    Room.prototype.handleGuess = function (playerId, guess) {
        var msg = "";
        var player = this.players.get(playerId);
        if (player.allowedToSend) {
            var points = this.vh.calculatePoints(guess);
            player.allowedToSend = false;
            msg = this.vh.stringifyverseList(guess) + " wurde gesendet.";
        }
        else {
            // @ts-ignore
            var verse = this.vh.stringifyverseList(player.history.at(-1));
            msg = verse + " wurde bereits gesendet. Nur der die erste Einsendung wird gewertet";
        }
        return msg;
    };
    return Room;
}());
exports.Room = Room;
