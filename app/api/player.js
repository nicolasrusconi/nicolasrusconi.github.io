var schemas = require("../model/schemas");

module.exports = function(app) {
    app.get("/api/player", function(req, res) {
        schemas.Player.find(function(err, players) {
            if (err) res.send(err);

            res.json(players);
        }).sort({"ranking": -1})
    });
    app.get("/api/player/:username", function(req, res) {
        schemas.Player.findOne({"username": req.params.username}, function(err, player) {
            if (err) res.send(err);
            res.json(player);
        })
    });
    app.get("/api/player", function(req, res) {
        var body = req.body;
        new schemas.Player(body).save(function(err, created) {
            if (err) res.send(err);
            res.send("created");
        })
        
    })
};