var schemas = require("../model/schemas");

module.exports = function(app) {
    app.post("/api/match", function(req, res) {
        var body = req.body;
        var tournament = body.tournament;
        schemas.Tournament.findOne({"name": tournament}, "_id", function(err, tournamentId) {
            if (err) res.send(err);
            body.tournament = tournamentId.id;
            var match = new schemas.Match(body);
            match.save(function(err, match) {
                if (err) res.send(err);
                res.send("created");
            })
        })
    });
    app.put("/api/match/", function(req, res) {
        var body = req.body;
        schemas.Match.update({"home.player": body.home.player, "away.player": body.away.player}, {$set: body}, function(err, result) {
            if (err) res.send(err);
            res.json(result);

        })
    });
    app.get("/api/match/tournament/:tournament", function(req, res) {
        schemas.Tournament.findOne({"name": req.params.tournament}, function(err, tournament) {
            if (err) res.send(err);
            schemas.Match.find({"tournament": tournament.id}, function(err, matches) {
                if (err) res.send(err);
                res.json(matches);
            })
        })
    });
    app.get("/api/match/player/:username", function(req, res) {
        var username = req.params.username;
        schemas.Match.find({ $or: [{"home.player": username}, {"away.player": username}]}, "-_id -__v").populate("tournament", "-_id -__v").exec(function(err, matches) {
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
