var schemas = require("../model/schemas");

module.exports = function(app) {
    app.post("/api/tournament", function(req, res) {
        var body = req.body;
        var tournament = new schemas.Tournament();
        tournament.name = body.name;
        if (body.date) {
            tournament.date = body.date;
        }
        tournament.save(function(err) {
            if (err) res.send(err);
            res.send("created");
        })

    });
    app.get("/api/tournament", function(req, res) {
        schemas.Tournament.find({}, "-_id -__v", function(err, tournaments) {
            if (err) res.send(err);
            res.json(tournaments);
        });
    });
    app.get("/api/tournament/:name", function(req, res) {
        schemas.Tournament.findOne({"name": req.params.name}, "-_id -__v", function(err, tournament) {
            if (err) res.send(err);
            res.json(tournament);
        })
    });
    app.delete("/api/tournament/:name", function(req, res) {
        schemas.Tournament.findOneAndRemove({"name": req.params.name}, function(err, tournament) {
            if (err) res.send(err);
            res.json(tournament);
        })
    });
    app.put("/api/tournament/:name", function(req, res) {
        var body = req.body;
        schemas.Tournament.update({"name": req.params.name}, { $set: body }, function(err, updated) {
            if (err) res.send(err);
            res.json(updated);
        })
    });
};

