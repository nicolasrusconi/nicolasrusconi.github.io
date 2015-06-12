var schemas = require("../model/schemas");
var google = require("../google");

module.exports = function(app) {
	app.get("/", function(req, res) {
		res.sendFile("./public/index.html");
	});
	app.get("/authUrl", function(req, res) {
		res.redirect(google.authUrl);
	});
	app.get("/oauth2callback", function(req, res) {
		var code = req.query.code;
		google.getUserInfo(code, function(response) {
			console.log(response);
		});
		res.redirect("/");
	});
};