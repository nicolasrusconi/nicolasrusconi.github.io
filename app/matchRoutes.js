var schemas = require("./model/schemas");

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
    app.get("/api/match/:tournament", function(req, res) {
        schemas.Tournament.findOne({"name": req.params.tournament}, function(err, tournament) {
            if (err) res.send(err);
            schemas.Match.find({"tournament": tournament.id}, function(err, matches) {
                if (err) res.send(err);
                res.json(matches);
            })
        })
    })
};
