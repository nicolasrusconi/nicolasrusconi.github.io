var schemas = require("../model/schemas");

module.exports = function(app) {
    app.get("/api/players", function(req, res) {
        schemas.Player.find(function(err, players) {
            if (err) res.send(err);

            res.json(players);
        }).sort({"ranking": -1})
    });
    app.get("/api/players/:username", function(req, res) {
        schemas.Player.findOne({"username": req.params.username}, function(err, player) {
            if (err) res.send(err);
            res.json(player);
        })
    });
};