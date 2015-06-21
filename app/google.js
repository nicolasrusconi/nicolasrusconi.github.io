var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var oauth2Client = new OAuth2("1082858892607-rads72knh0qse436hqgph68t063emiig.apps.googleusercontent.com", "EMFlqAXcak5VyArzYQvInjeO", "http://localhost:8080/oauth2callback");
google.options({ auth: oauth2Client }); // set auth as a global default

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.email'
];

var googleApi = {};

googleApi.authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
    scope: scopes // If you only need one scope you can pass it as string
});

googleApi.getUserInfo = function(code, callback) {
    oauth2Client.getToken(code, function(err, tokens) {
        if(!err) {
            oauth2Client.setCredentials(tokens);
        } else {
            throw new Error(err);
        }
        var plus = google.plus('v1');
        plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
            response.tokens = tokens;
            callback.call(this, response);
        });
    });
};

module.exports = googleApi;