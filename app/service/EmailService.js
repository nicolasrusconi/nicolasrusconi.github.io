var nodemailer = require('nodemailer');
var _ = require("underscore");
var constants = require("../constants");
var playerService = require("../service/PlayerService");

var config = {
    service: 'gmail',
    auth: {
        user: process.env.FIFA_EMAIL,
        pass: process.env.FIFA_EMAIL_PASS
    }
};
var transporter = nodemailer.createTransport(config);

var sendEmail = function(to, subject, body) {
    transporter.sendMail({
        from: config.auth.user,
        to: to,
        subject: subject,
        text: body,
        bcc: 'ezequiel@medallia.com,santiago@medallia.com,nicolas@medallia.com'
    });
};

var hasConfigAvailable = function() {
    if (!config.auth.user || !config.auth.pass) {
        console.warn("[WARN] Email account settings not set, skipping email send.");
        return false;
    }
    return true;
};

var findUsersForMatchEmail = function(match) {
    var findIn = function (match, homeOrAway, alias) {
        return (match[homeOrAway][constants.PLAYER] == alias || match[homeOrAway][constants.PARTNER] == alias);
    };
    var getPlayersFor = function(match, homeOrAway) {
        return [match[homeOrAway][constants.PLAYER], match[homeOrAway][constants.PARTNER]]
    };
    var createdByAlias = match.createdBy;
    var homePlayers = getPlayersFor(match, constants.HOME);
    var awayPlayers = getPlayersFor(match, constants.AWAY);

    if (findIn(match, constants.HOME, createdByAlias)) {
        return awayPlayers;
    } else if (findIn(match, constants.AWAY, createdByAlias)) {
        return homePlayers;
    } else {
        return _.union(homePlayers, awayPlayers);
    }
};

var formatTeam = function(match, homeOrAway) {
    var team = match[homeOrAway];
    var player = team[constants.PLAYER];
    var partner = team[constants.PARTNER];
    var suffix = '';
    if (partner) {
        suffix = " & " + partner;
    }
    return "\t" + player + suffix + 
        "\n\tGoals: "+ team.goals + ", Yellow cards: " + team.yellowCards + ", Red cards: " + team.redCards; 
};

var sendMatchEmail = function(match, tournamentName) {
    if (!hasConfigAvailable()) {
        return;
    }
    var creator = match.createdBy;
    var body = "Match highlights: \n\n" +
            "Tournament: " + tournamentName + ", Phase: " + match.phase + "\n\n" +
            "Home Team: \n" +
            formatTeam(match, constants.HOME) + "\n" +
            "----\n" +
            "Away Team: \n" +
            formatTeam(match, constants.AWAY) + "\n\n" +
        "Cheers, The Fifa Medallia Team\n " + (process.env.HEROKU_URL) ;
    var aliases = findUsersForMatchEmail(match);
    var condition = {"$or": []};
    _.each(aliases, function(alias) {
        condition["$or"].push({"alias": alias})
    });
    playerService.getPlayersBy(condition, function(err, values) {
        if (err) {
            console.error(err);
        } else {
            var textValues = [];
            _.each(values, function(object) {
                textValues.push(object.email);
            });
            sendEmail(textValues.join(), creator + ' added a match in which you played', body)
        }
    });
};

hasConfigAvailable();
module.exports = {
    sendMatchEmail: sendMatchEmail
};