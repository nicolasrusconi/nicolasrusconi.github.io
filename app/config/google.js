var GoogleStrategy = require('passport-google-oauth2').Strategy;
var playerManager = require("../model/playerManager");

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: (process.env.HEROKU_URL || process.env.LOCAL_URL + ":" + process.env.PORT) + "/auth/google/callback",
            passReqToCallback   : true

        },
        function(request, accessToken, refreshToken, profile, done) {
            // asynchronous verification, for effect...
            playerManager.createNewPlayer(profile, function(player) {
                process.nextTick(function () {
                    return done(null, player);
                })
            })
            ;
        }
    ));
};