var apiHandler = require("./ApiHandler");
var generator = require('../service/TournamentGeneratorService');
var service = require("../service/TournamentService");

module.exports = function(app) {
    app.post("/api/tournament", apiHandler.authenticateUser, function(req, res, next) {
        service.save(req.body, function(err) {
            apiHandler.handleResponse(req, res, next, err, req.body);
        });
    });
    app.get("/api/tournament", function(req, res, next) {
        service.getTournaments(function(err, tournaments) {
            apiHandler.handleResponse(req, res, next, err, tournaments);
        }, 'desc');
    });
    app.get("/api/tournament/:name", function(req, res, next) {
        var name = req.params.name;
        var condition = {};
        name == "current" ? condition.current = true : condition.name = name;
        service.getTournament(condition, function(err, tournament) {
            apiHandler.handleResponse(req, res, next, err, tournament);
        }, 'desc');
    });
    app.delete("/api/tournament/:name", apiHandler.authenticateUser, function(req, res, next) {
        service.delete(req.params.name, function(err, tournament) {
            apiHandler.handleResponse(req, res, next, err, tournament);
        });
    });
    app.put("/api/tournament/:name", apiHandler.authenticateUser, function(req, res, next) {
        var body = req.body;
        service.update(req.params.name, body, function(err, updated) {
            apiHandler.handleResponse(req, res, next, err, updated);
        })
    });
    app.post('/api/tournament/generate', apiHandler.authenticateUser, function(req, res, next) {
        generator.generate(req.body, req.body.secondRound);
        res.send("Received, generating tournament...");
    });
    app.post('/api/tournament/csvGenerate', apiHandler.authenticateUser, function(req, res, next) {
        generator.createMatchFromCSV(req.body.data);
        res.send("Received, generating matches...");
    });
};

