var schemas = require("../model/schemas");
var stats = require("../service/statistic");
var ranking = require("../service/ranking");
var apiHandler = require("./apiHandler");
var email = require('../service/email');
var tournamentService = require("../service/tournamentService");

module.exports = function(app) {
    app.post("/api/match", apiHandler.authenticateUser, function(req, res, next) {
        var body = req.body;
        body.createdBy = req.user.alias;
        var tournamentName = body.tournament.name ? body.tournament.name : body.tournament;
        tournamentService.getTournament({"name": tournamentName}, function(err, tournament) {
            apiHandler.handleResponse(req, res, next, err, function() {
                body.tournament = tournament._id;
                var match = new schemas.Match(body);
                match.save(function(err, match) {
                    apiHandler.handleResponse(req, res, next, err, function() {
                        stats.updateForPlayer([match.home.player, match.home.partner, match.away.player, match.away.partner]);
                        ranking.calculateGeneralRanking(function() {
                            email.sendMatchEmail(match);
                            res.send("created");
                        });
                    })
                })
            })
        })

    });
    app.put("/api/match/", apiHandler.authenticateAdmin, function(req, res, next) {
        var body = req.body;
        tournamentService.getTournament(body.tournament, function(err, tournament) {
            apiHandler.handleResponse(req, res, next, err, function() {
                body.tournament = tournament;
                schemas.Match.update({"_id": body._id}, {$set: body}, function(err, result) {
                    apiHandler.handleResponse(req, res, next, err, function() {
                        stats.updateForPlayer([body.home.player, body.home.partner, body.away.player, body.away.partner]);
                        ranking.calculateGeneralRanking(function() {
                            res.json(result);
                        });
                    });
                })
            })
        })
    });
    app.get("/api/match/tournament/:tournament", function(req, res, next) {
        var tournamentName = req.params.tournament;
        var condition = {};
        tournamentName == "current" ? condition.current = true : condition.name = tournamentName;
        tournamentService.getTournament(condition, function(err, tournament) {
            apiHandler.handleResponse(res, req, next, err, function() {
                tournamentName = tournament.name;
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
            })
        });
    });
    app.get("/api/match/player/:alias", function(req, res, next) {
        var alias = req.params.alias;
        schemas.Match.find({ $or: [{"home.player": alias}, {"away.player": alias}, {"home.partner": alias}, {"away.partner": alias}]}, "-__v").populate("tournament", "-_id -__v").exec(function(err, matches) {
            if (err) res.send(err);
            res.json(matches);
        })
    });
    app.get("/api/match", function(req, res, nextreq, res) {
        schemas.Match.find({}, "-_id -__v").populate("tournament", "-_id -__v").exec(function(err, matches) {
            if (err) res.send(err);
            res.json(matches);
        })
    })
};
