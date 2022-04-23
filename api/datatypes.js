"use strict";
exports.__esModule = true;
exports.Player = void 0;
var unique_names_generator_1 = require("unique-names-generator");
var Player = /** @class */ (function () {
    function Player(id, sid) {
        this.name = (0, unique_names_generator_1.uniqueNamesGenerator)({ dictionaries: [unique_names_generator_1.names] });
        this.points = 0;
        this.allowedToSend = true;
        this.history = [];
        this.currentTipPoints = 0;
        this.id = id;
        this.socketid = sid;
    }
    return Player;
}());
exports.Player = Player;
