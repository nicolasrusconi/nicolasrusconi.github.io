var schemas = require("../model/schemas");
var stats = require("../service/statistic");
var ranking = require("../service/ranking");
var validation = require("./validation");
var email = require('../service/email');

module.exports = function(app) {
    app.post("/api/match", validation.authenticateUser, function(req, res) {
        var body = req.body;
        body.createdBy = req.user.alias;
        var tournamentName = body.tournament.name ? body.tournament.name : body.tournament;
        schemas.Tournament.findOne({"name": tournamentName}, "_id", function(err, tournamentId) {
            if (err) res.send(err);
            body.tournament = tournamentId._id;
            var match = new schemas.Match(body);
            match.save(function(err, match) {
                if (err) res.send(err);
                stats.updateForPlayer([match.home.player, match.home.partner, match.away.player, match.away.partner]);
                ranking.calculateGeneralRanking(function() {
                    email.sendMatchEmail(match, tournamentName);
                    res.send("created");
                });
            })
        })
    });
    app.put("/api/match/", validation.authenticateAdmin, function(req, res) {
        var body = req.body;
        schemas.Tournament.findOne(body.tournament, function(err, tournament2) {
            if (err) res.send(err);
            body.tournament = tournament2;
            schemas.Match.update({"_id": body._id}, {$set: body}, function(err, result) {
                if (err) res.send(err);
                stats.updateForPlayer([body.home.player, body.home.partner, body.away.player, body.away.partner]);
                ranking.calculateGeneralRanking(function() {
                    res.json(result);
                });
            })    
        })
    });
    app.get("/api/match/tournament/:tournament", function(req, res) {
        var tournamentName = req.params.tournament;
        if (tournamentName == "current") {
            //FIXME: create a module for commons operations in the db.
            schemas.Tournament.findOne({current: true}, "name", function(err, tournament) {
                if (err) res.send(err);
                tournamentName = tournament.name;
            }).sort({creationDate: -1})
        }
        var filter = function(match) {
            return match.tournament.name == tournamentName;
        };
        schemas.Match.find({}, "-__v").populate({
            path: "tournament"/*, FIXME: this should work but I don't know why not...
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
        schemas.Match.find({ $or: [{"home.player": alias}, {"away.player": alias}, {"home.partner": alias}, {"away.partner": alias}]}, "-__v").populate("tournament", "-_id -__v").exec(function(err, matches) {
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
