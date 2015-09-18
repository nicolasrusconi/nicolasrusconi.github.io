var GoogleStrategy = require('passport-google-oauth2').Strategy;
var playerManager = require("../model/playerManager");

module.exports = function(passport) {
    if (!process.env.GOOGLE_CLIENT_ID && ! process.env.GOOGLE_CLIENT_SECRET) {
        console.warn("[WARN] Google client id and secret not valid, login disabled.");
    }
    
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID || '0',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '0',
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