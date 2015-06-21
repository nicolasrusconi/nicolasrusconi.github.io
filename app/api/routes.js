var google = require("../google");
var playerManager = require("../model/playerManager");

module.exports = function(app) {
	app.get("/authUrl", function(req, res) {
		res.redirect(google.authUrl);
	});
	app.get("/oauth2callback", function(req, res) {
		var code = req.query.code;
		google.getUserInfo(code, function(response) {
			var player = playerManager.createNewPlayer(response, function(player) {
				console.log("recibi al player" + player);
				var options = {
					root: __dirname + '/../../public/',
					dotfiles: 'deny',
					headers: {
						'username': player.username,
						'token': player.id_token
					}
				};
				res.sendFile("index.html", options);
			});
		});
	});
};