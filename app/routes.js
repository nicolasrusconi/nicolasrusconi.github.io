var schemas = require("./models/schemas");

function getPlayerId(username) {
	var id = null;
	schemas.Player.findOne({"username": username}, "_id", function(err, player) {
		if (err) console.log(err);
		console.log(player);
		id = player.id
	});
	return id;
}

module.exports = function(app) {
	app.get("/", function(req, res) {
		res.sendFile("./public/index.html");
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
	app.get("/api/team", function(req, res) {
		
		var team = new schemas.Team();
		team.player1 = getPlayerId("ezequiel");
		team.player2 = getPlayerId("nico");
		team.save();
		res.json({});
	});
};

