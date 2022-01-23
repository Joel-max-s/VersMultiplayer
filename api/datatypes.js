"use strict";
exports.__esModule = true;
exports.Player = void 0;
var Player = /** @class */ (function () {
    function Player(id, sid) {
        this.allowedToSend = true;
        this.history = [];
        this.currentTipPoints = 0;
        this.id = id;
        this.socketid = sid;
    }
    return Player;
}());
exports.Player = Player;
