var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    lastAccess: { type: Date, default: Date.now },
    ranking: Number
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
    homeTeam: {type: Schema.Types.ObjectId, ref: 'Team'},
    awayTeam: {type: Schema.Types.ObjectId, ref: 'Team'},
    tournament: {type: Schema.Types.ObjectId, ref: "Tournament"},
    phase: String
});

var tournamentSchema = new Schema({
    name: String,
    date: Date,
    winner: {type: Schema.Types.ObjectId, ref: 'User'},
    second: {type: Schema.Types.ObjectId, ref: 'User'},
    third: {type: Schema.Types.ObjectId, ref: 'User'}
});

exports.Player = mongoose.model("Player", playerSchema);
exports.Team = mongoose.model("Team", teamSchema);
exports.Match = mongoose.model("Match", matchSchema);
exports.Tournament = mongoose.model("Tournament", tournamentSchema);

