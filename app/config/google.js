var GoogleStrategy = require('passport-google-oauth2').Strategy;
var parser = require("../model/playerParser");
var playerService = require("../service/PlayerService");

//FIXME: handle this better
var __createNewPlayer = function(jsonPlayer, callback) {
    var schemaPlayer = parser.parse(jsonPlayer);
    if (schemaPlayer) {
        playerService.getByGoogleId(schemaPlayer.googleId, function(err, player) {
            if (err) console.error(err);
            else if (player) {
                console.info("Player already created. " + schemaPlayer.username);
                callback.call(this, player);
            } else {
                schemaPlayer.save(function(err, saved) {
                    if (err) {
                        console.error("cannot save player");
                    }
                    else {
                        console.info("Player saved");
                        callback.call(this, schemaPlayer);
                    }
                });
            }
        })
    }
};

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: (process.env.HEROKU_URL || process.env.LOCAL_URL + ":" + process.env.PORT) + "/auth/google/callback",
            passReqToCallback   : true

        },
        function(request, accessToken, refreshToken, profile, done) {
            // asynchronous verification, for effect...
            __createNewPlayer(profile, function(player) {
                process.nextTick(function () {
                    return done(null, player);
                })
            })
            ;
        }
    ));
};