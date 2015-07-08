var schemas = require("../model/schemas");
var _ = require("underscore");

var randomSelect = function(players, teams, callback) {
    if (players.length != teams.length) {
        throw new Error("Lengths are not the same");
    }
    var shuffledPlayers = _.shuffle(players);
    var shuffledTeams = _.shuffle(teams);
    var result = [];
    for (var i=0; i<players.length; i++) {
        var select = {};
        select.player = shuffledPlayers[i];
        select.team = shuffledTeams[i];
        result.push(select);
    }
    callback.call(this, result);
};
var createMatchFromCSV = function(matchesCSV) {
    var array = matchesCSV.split("\n").map(function(line) { return line.split(",").map(function(cell) { return cell.trim() }); });
    return createMatchFromArray(array)
};

var createMatchFromArray = function(matchesArray) {
    _.each(matchesArray, function(matchArray) {
        if (matchArray.length != 11) {
            throw new Error("invalid array length");
        }
        var match = new schemas.Match();
        match.home.player = matchArray[0];
        match.home.partner = matchArray[1];
        match.home.team = matchArray[2];
        match.away.player = matchArray[3];
        match.away.partner = matchArray[4];
        match.away.team = matchArray[5];
        match.home.goals = parseInt(matchArray[6]);
        match.away.goals = parseInt(matchArray[7]);
        match.date = new Date(matchArray[8]);
        var tournamentName = matchArray[9];
        match.phase = matchArray[10];
        schemas.Tournament.findOne({"name": tournamentName}, "_id", function(err, tournament) {
            if (err) {
                console.error(err);
                return;
            }
            match.tournament = tournament._id;
            saveMatch(match);
        });
    });
};

var generateMatches = function(model) {
    var tournamentName = model.tournamentName;
    schemas.Tournament.findOne({"name": tournamentName}, "_id", function(err, tournamentId) {
        if (err) {
            console.error(err);
            return;
        }
        _.each(model.groups, function(group) {
            var length = group.players.length;
            var matches = [];
            for (var i = length-1; i >= 0; i--) {
                for (var j = 1; j < i+1; j++) {
                    var match = new schemas.Match();
                    match.tournament = tournamentId._id;
                    match.phase = group.name;
                    match.home.player = group.players[i].name;
                    match.home.team = group.players[i].team;
                    match.away.player = group.players[i - j].name;
                    match.away.team = group.players[i - j].team;
                    console.log(match.home.player + " vs " + match.away.player);
                    matches.push(match);
                }
            }
            var rounds = matches.length / 2;
            console.log("rounds: " + rounds);
            for (i = 0; i < rounds; i++) {
                saveMatch(matches[i]);
                saveMatch(matches[matches.length-1-i]);
            }
        });    
    });
};

var saveMatch = function(match) {
    match.save(function(err, match) {
        if (err) {
            console.error(err);
            throw new Error();
        }
        console.log("created");
    });
};

module.exports = {
    createMatchFromCSV: createMatchFromCSV,
    generate: generateMatches,
    randomSelect: randomSelect
};