var schemas = require("../model/schemas");
var ranking = require("../service/ranking");
var stats = require("../service/statistic");
var validation = require("./apiHandler");
var _ = require("underscore");

module.exports = function(app) {
    app.get("/api/player", function(req, res) {
        schemas.Player.find(function(err, players) {
            if (err) res.send(err);

            res.json(players);
        }).sort({"ranking": -1})
    });
    app.get("/api/player/:alias", function(req, res) {
        schemas.Player.findOne({"alias": req.params.alias}, function(err, player) {
            if (err) res.send(err);
            res.json(player);
        })
    });
    app.post("/api/player", function(req, res) {
        var body = req.body;
        new schemas.Player(body).save(function(err, created) {
            if (err) res.send(err);
            res.send("created");
        })
    });
    app.post("/api/player/ranking", validation.authenticateUser, function(req, res) {
        ranking.calculateGeneralRanking(function(glickoPlayers) {
            res.send("Finished successfully")
        })
    });
    app.get("/api/player/stats/all", function(req, res) {
        res.json(stats.allPlayerStatistics());
    });
    app.get("/api/player/stats/:alias", function(req, res) {
        res.json(stats.playerStatistics(req.params.alias));
    });
    
};