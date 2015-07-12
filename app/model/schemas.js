var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
    username: String,
    firstName: String,
    lastName: String,
    alias: String,
    email: String,
    image: String,
    lastAccess: { type: Date, default: Date.now },
    ranking: {type: Number, default: 1500},
    previousRanking: Number,
    googleId: {type: String, required: true},
    admin: {type: Boolean, default: false}
});

var matchSchema = new Schema({
    date: Date,
    home: {
        player: {type: String, required: true},
        partner: {type: String, required: false},
        goals: {type: Number, default: -1},
        redCards: {type: Number, default: -1},
        yellowCards: {type: Number, default: -1},
        team: String
    },
    away: {
        player: {type: String, required: true},
        partner: {type: String, required: false},
        goals: {type: Number, default: -1},
        redCards: {type: Number, default: -1},
        yellowCards: {type: Number, default: -1},
        team: String
    },
    tournament: {type: Schema.Types.ObjectId, ref: "Tournament"},
    phase: {type: String, required: true}
});

var tournamentSchema = new Schema({
    name: {type: String, required: true},
    creationDate: { type: Date, default: Date.now },
    current: {type: Boolean, default: false},
    config: {
        phases: [String],
        defaultPhase: String,
        phasesWithStandings: [String],
        standingsModel: String
    },
    winner: {type: Schema.Types.ObjectId, ref: 'User', default: null},
    second: {type: Schema.Types.ObjectId, ref: 'User', default: null},
    third: {type: Schema.Types.ObjectId, ref: 'User', default: null}
});

exports.Player = mongoose.model("Player", playerSchema);
exports.Match = mongoose.model("Match", matchSchema);
exports.Tournament = mongoose.model("Tournament", tournamentSchema);

