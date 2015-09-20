var stats = require("../service/BasicStatsService");
var ranking = require("../service/RankingService");
var apiHandler = require("./ApiHandler");
var email = require('../service/EmailService');
var tournamentService = require("../service/TournamentService");
var matchService = require("../service/MatchService");

module.exports = function(app) {
    app.post("/api/match", apiHandler.authenticateUser, function(req, res, next) {
        var body = req.body;
        body.createdBy = req.user.alias;
        var tournamentName = body.tournament.name ? body.tournament.name : body.tournament;
        tournamentService.getTournament({"name": tournamentName}, function(err, tournament) {
            apiHandler.handleResponse(req, res, next, err, function () {
                body.tournament = tournament._id;
                matchService.save(body, function (err, match) {
                    apiHandler.handleResponse(req, res, next, err, function () {
                        stats.updateForPlayer([match.home.player, match.home.partner, match.away.player, match.away.partner]);
                        ranking.calculateGeneralRanking(function () {
                            email.sendMatchEmail(match);
                            apiHandler.handleResponse(req, res, next, err, "created");
                        });
                    });
                });
            });
        });
    });
    app.put("/api/match/", apiHandler.authenticateAdmin, function(req, res, next) {
        var body = req.body;
                matchService.update(body._id, body, function(err, result) {
                    apiHandler.handleResponse(req, res, next, err, function() {
                        stats.updateForPlayer([body.home.player, body.home.partner, body.away.player, body.away.partner]);
                        ranking.calculateGeneralRanking(function() {
                            apiHandler.handleResponse(req, res, next, err, result);
                        });
                    });
                });
    });
    app.get("/api/match/tournament/:tournament", function(req, res, next) {
        var tournamentName = req.params.tournament;
        var condition = {};
        tournamentName == "current" ? condition.current = true : condition.name = tournamentName;
        tournamentService.getTournament(condition, function(err, tournament) {
            apiHandler.handleResponse(res, req, next, err, function() {
                matchService.getForTournament(tournament._id, function(err, matches) {
                    apiHandler.handleResponse(req, res, next, err, matches);
                });
            })
        }, "desc");
    });
    app.get("/api/match/player/:alias", function(req, res, next) {
        var alias = req.params.alias;
        matchService.getForAlias(alias, function(err, matches) {
            apiHandler.handleResponse(req, res, next, err, matches);
        });
    });
    app.get("/api/match", function(req, res, next) {
        matchService.getMatches(function(err, matches) {
            apiHandler.handleResponse(req, res, next, err, matches);
        });
    })
};
