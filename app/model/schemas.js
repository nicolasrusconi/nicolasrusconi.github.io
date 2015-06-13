var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
    username: String,
    firstName: String,
    lastName: String,
    email: String,
    image: String,
    lastAccess: { type: Date, default: Date.now },
    ranking: {type: Number, default: 1500}
});

var teamSchema = new Schema({
    player1: {type: Schema.Types.ObjectId, ref: 'User'},
    player2: {type: Schema.Types.ObjectId, ref: 'User'},
    goals: {type: Number, default: -1},
    redCards: {type: Number, default: -1},
    yellowCards: {type: Number, default: -1},
    teamName: String
});

var matchSchema = new Schema({
    date: Date,
    home: {
        player: {type: String, required: true},
        partner: {type: String, required: true},
        goals: {type: Number, default: -1},
        redCards: {type: Number, default: -1},
        yellowCards: {type: Number, default: -1},
        team: String
    },
    away: {
        player: {type: String, required: true},
        partner: {type: String, required: true},
        goals: {type: Number, default: -1},
        redCards: {type: Number, default: -1},
        yellowCards: {type: Number, default: -1},
        team: String
    },
    tournament: {type: Schema.Types.ObjectId, ref: "Tournament"},
    phase: {type: String, required: true}
});

var tournamentSchema = new Schema({
    name: String,
    creationDate: { type: Date, default: Date.now },
    winner: {type: Schema.Types.ObjectId, ref: 'User', default: null},
    second: {type: Schema.Types.ObjectId, ref: 'User', default: null},
    third: {type: Schema.Types.ObjectId, ref: 'User', default: null}
});

exports.Player = mongoose.model("Player", playerSchema);
exports.Team = mongoose.model("Team", teamSchema);
exports.Match = mongoose.model("Match", matchSchema);
exports.Tournament = mongoose.model("Tournament", tournamentSchema);

