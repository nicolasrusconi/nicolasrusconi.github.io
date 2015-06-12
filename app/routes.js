var schemas = require("./model/schemas");
var google = require("./google");

module.exports = function(app) {
	app.get("/", function(req, res) {
		res.sendFile("./public/index.html");
	});
	app.get("/authUrl", function(req, res) {
		res.send(google.authUrl);
	});
	app.get("/oauth2callback", function(req, res) {
		var code = req.query.code;
		google.getUserInfo(code, function(response) {
			console.log(response);
		});
		res.redirect("/");
	});
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