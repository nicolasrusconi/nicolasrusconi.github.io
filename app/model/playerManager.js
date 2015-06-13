var schemas = require("./schemas");
var parser = require("./playerParser");

function PlayerManager() {
    this._players = [];
}

PlayerManager.prototype.addPlayer = function(player) {
    this._players.push(player);
};

PlayerManager.prototype.createNewPlayer = function(jsonPlayer) {
    var schemaPlayer = parser.parse(jsonPlayer);
    if (schemaPlayer) {
        var me = this;
        schemas.Player.findOne({username: schemaPlayer.username}, function(err, player) {
            if (err) console.error(err);
            else if (player) {
                console.info("Player already created. " + schemaPlayer.username);
            } else {
                schemaPlayer.save(function(err, saved) {
                    if (err) console.error("cannot save player");
                    else {
                        console.info("Player saved");
                        me.addPlayer(saved);
                    }
                })
            }
        });
    }
};
var playerManager = new PlayerManager();

module.exports = playerManager;
