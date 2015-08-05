var schemas = require("../model/schemas");
var validation = require("./validation");
var generator = require('../service/tournamentGenerator');

module.exports = function(app) {
    app.post("/api/tournament", validation.authenticateUser, function(req, res) {
        var body = req.body;
        var tournament = new schemas.Tournament(body);
        tournament.save(function(err) {
            if (err) res.send(err);
            res.send("created");
        })

    });
    app.get("/api/tournament", function(req, res) {
        schemas.Tournament.find({}, "-_id -__v").sort({creationDate: 'desc'}).exec(function(err, tournaments) {
            if (err) res.send(err);
            res.json(tournaments);
        });
    });
    app.get("/api/tournament/:name", function(req, res) {
        var name = req.params.name;
        var condition = {};
        name == "current" ? condition.current = true : condition.name = name;
        schemas.Tournament.findOne(condition, "-_id -__v", function(err, tournament) {
            if (err) res.send(err);
            res.json(tournament);
        }).sort({creationDate: -1})
    });
    app.delete("/api/tournament/:name", validation.authenticateUser, function(req, res) {
        schemas.Tournament.findOneAndRemove({"name": req.params.name}, function(err, tournament) {
            if (err) res.send(err);
            res.json(tournament);
        })
    });
    app.put("/api/tournament/:name", validation.authenticateUser, function(req, res) {
        var body = req.body;
        schemas.Tournament.update({"name": req.params.name}, { $set: body }, function(err, updated) {
            if (err) res.send(err);
            res.json(updated);
        })
    });
    app.post('/api/tournament/generate', validation.authenticateUser, function(req, res) {
        generator.generate(req.body, req.body.secondRound);
        res.send("Received, generating tournament...");
    });
    app.post('/api/tournament/csvGenerate', validation.authenticateUser, function(req, res) {
        generator.createMatchFromCSV(req.body.data);
        res.send("Received, generating matches...");
    });
    app.get("/api/tournament/randomSelect", validation.authenticateUser, function(req, res) {
        generator.randomSelect(req.body.players, req.body.teams, function(selections) {
            res.json(selections);
        });
    });
};

