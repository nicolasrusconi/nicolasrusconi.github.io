var rankingService = require("../service/RankingService");
var statsService = require("../service/BasicStatsService");
var apiHandler = require("./ApiHandler");
var playerService = require("../service/PlayerService");
var _ = require("underscore");

module.exports = function(app) {
    app.get("/api/player", function(req, res, next) {
        playerService.getPlayers(function(err, players) {
            apiHandler.handleResponse(req, res, next, err, players);
        });
    });
    app.get("/api/player/:alias", function(req, res, next) {
        playerService.getByAlias(req.params.alias, function(err, player) {
            apiHandler.handleResponse(req, res, nex, err, player);
        });
    });
    app.post("/api/player", function(req, res, next) {
        var body = req.body;
        playerService.save(body, function(err) {
            apiHandler.handleResponse(req, res, next, err, body);
        });
    });
    app.post("/api/player/ranking", apiHandler.authenticateUser, function(req, res, next) {
        rankingService.calculateGeneralRanking(function(glickoPlayers) {
            res.send("Finished successfully")
        })
    });
    app.get("/api/player/stats/all", function(req, res, next) {
        res.json(statsService.allPlayerStatistics());
    });
    app.get("/api/player/stats/:alias", function(req, res, next) {
        res.json(statsService.playerStatistics(req.params.alias));
    });
    
};