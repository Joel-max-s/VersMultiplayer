"use strict";
// alle Spieler tracken
// die Verse Senden
// sich um die Zeit kümmern
exports.__esModule = true;
exports.Room = void 0;
var datatypes_1 = require("./datatypes");
var server_1 = require("./server");
var verses_1 = require("./verses");
var Room = /** @class */ (function () {
    function Room(id) {
        this.players = new Map();
        this.countdown = null;
        this.vh = new verses_1.VerseHandler();
        this.id = id;
    }
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
    Room.prototype.startTimer = function (time) {
        var _this = this;
        //temp
        console.log(this.vh.generateVerse());
        this.timeLeft = time;
        this.countdown = setInterval(function () {
            (0, server_1.getIO)().to(_this.id).emit('timer', _this.timeLeft + ' Sekunden');
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
    return Room;
}());
exports.Room = Room;
