var schemas = require("../model/schemas");
var validation = require("./validation");

module.exports = function(app) {
    app.post("/api/match", validation.authenticateUser, function(req, res) {
        var body = req.body;
        var tournament = body.tournament;
        schemas.Tournament.findOne({"name": tournament}, "_id", function(err, tournamentId) {
            if (err) res.send(err);
            body.tournament = tournamentId._id;
            var match = new schemas.Match(body);
            match.save(function(err, match) {
                if (err) res.send(err);
                res.send("created");
            })
        })
    });
    app.put("/api/match/", validation.authenticateUser, function(req, res) {
        var body = req.body;
        schemas.Tournament.findOne(body.tournament, function(err, tournament2) {
            if (err) res.send(err);
            body.tournament = tournament2;
            schemas.Match.update({"home.player": body.home.player, "away.player": body.away.player, tournament: tournament2._id, phase: body.phase}, {$set: body}, function(err, result) {
                if (err) res.send(err);
                res.json(result);
            })    
        })
    });
    app.get("/api/match/tournament/:tournament", function(req, res) {
        var tournamentName = req.params.tournament;
        var filter = function(match) {
            return tournamentName == "current" ? match.tournament.current == true : match.tournament.name == tournamentName;
        };
        schemas.Match.find({}, "-_id -__v").populate({
            path: "tournament"/*,
            match: { name: "Torneo 0"},
            select: "-_id -__v"*/
        }).exec(function(err, matches) {
            if (err) res.send(err);
            matches = matches.filter(function(match) {
                return filter(match);
            });
            res.json(matches);
        });
    });
    app.get("/api/match/player/:alias", function(req, res) {
        var alias = req.params.alias;
        schemas.Match.find({ $or: [{"home.player": alias}, {"away.player": alias}, {"home.partner": alias}, {"away.partner": alias}]}, "-_id -__v").populate("tournament", "-_id -__v").exec(function(err, matches) {
            if (err) res.send(err);
            res.json(matches);
        })
    });
    app.get("/api/match", function(req, res) {
        schemas.Match.find({}, "-_id -__v").populate("tournament", "-_id -__v").exec(function(err, matches) {
            if (err) res.send(err);
            res.json(matches);
        })
    })
};
