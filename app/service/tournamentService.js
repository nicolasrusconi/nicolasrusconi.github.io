var schemas = require("../model/schemas");
var __ = require("../constants");

var getTournaments = function(callback, sortOrder) {
    schemas.Tournament.find({}).sort({creationDate: sortOrder}).exec(callback);
};

var save = function(body, callback) {
    var tournament = new schemas.Tournament(body);
    tournament.save(callback);
};

var deleteByName = function(name, callback) {
    schemas.Tournament.findOneAndRemove({"name": name}, callback);
};

var getTournament = function(condition, callback, sortOrder) {
    schemas.Tournament.findOne(condition, callback).sort({creationDate: sortOrder == "desc" ? -1 : 1})
};

var update = function(name, body, callback) {
    schemas.Tournament.update({"name": name}, { $set: body }, callback);
};

module.exports = {
    getTournaments: getTournaments,
    getTournament: getTournament,
    save: save,
    delete: deleteByName,
    update: update

}