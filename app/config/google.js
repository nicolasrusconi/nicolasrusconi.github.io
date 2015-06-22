var GoogleStrategy = require('passport-google-oauth2').Strategy;
var playerManager = require("../model/playerManager");

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
            clientID: "1082858892607-rads72knh0qse436hqgph68t063emiig.apps.googleusercontent.com",
            clientSecret: "3l0va1TrAL6Bd43ht3QmfeCB",
            callbackURL: "http://localhost:8080/auth/google/callback",
            passReqToCallback   : true

        },
        function(request, accessToken, refreshToken, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {
                return done(null, playerManager.createNewPlayer(profile));
            });
        }
    ));
};