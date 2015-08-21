var glicko2 = require("glicko2");
var _ = require("underscore");
var schemas = require("../model/schemas");

var updatePlayerRating = function(player, ratingBefore, ratingAfter) {
    if (player) {
        var rating = (ratingAfter.getRating() - ratingBefore.getRating()) / 2;
        player.setRating(player.getRating() + rating );
    }
};

glicko2.Glicko2.prototype.updateRatings = function(match){
    var initialPlayersLength = this.players.length;
    var avg = function(val1, val2) {
        return (val1 + val2)/2;
    };
    //clean matches...
    this.cleanPreviousMatches();
    //obtain players...
    var homePlayer = match[0], homePartner = match[1], awayPlayer = match[2], awayPartner = match[3];
    var matchResult = match[4];
    var player1, player2;
    // single player or multiplayer?
    if (!homePartner && !awayPartner) {
        player1 = homePlayer;
        player2 = awayPlayer;
        return;
    } else if (!homePartner || !awayPartner){
        console.error("something wrong happened, one of the partners is null");
        return;
    } else {
        player1 = this.makePlayer(avg(homePlayer.getRating(), homePartner.getRating()), avg(homePlayer.getRd(), homePartner.getRd()), avg(homePlayer.getVol(), homePartner.getVol()), avg(homePlayer._tau, homePartner._tau));
        player2 = this.makePlayer(avg(awayPlayer.getRating(), awayPartner.getRating()), avg(awayPlayer.getRd(), awayPartner.getRd()), avg(awayPlayer.getVol(), awayPartner.getVol()), avg(awayPlayer._tau, awayPartner._tau));
    }

    this.addResult(player1, player2, matchResult);
    //save original players for future calculations...
    var oldPlayer1 = _.clone(player1);
    var oldPlayer2 = _.clone(player2);

    this.calculatePlayersRatings();
    console.log("Team 1: " + (player1.getRating() - oldPlayer1.getRating()));
    console.log("Team 2: " + (player2.getRating() - oldPlayer2.getRating()));
    //update all players involved...
    updatePlayerRating(homePlayer, oldPlayer1, player1);
    updatePlayerRating(homePartner, oldPlayer1, player1);
    updatePlayerRating(awayPlayer, oldPlayer2, player2);
    updatePlayerRating(awayPartner, oldPlayer2, player2);
    if (this.players.length != initialPlayersLength) {
        this.players.slice(0, initialPlayersLength -2);
    }
};

var settings = {
    // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
    //       be tested to decide which value results in greatest predictive accuracy."
    tau : 0.5,
    // rating : default rating
    rating : 1500,
    //rd : Default rating deviation
    //     small number = good confidence on the rating accuracy
    rd : 10,
    //vol : Default volatility (expected fluctation on the player rating)
    vol : 0.06
};

var ranking = new glicko2.Glicko2(settings);

var glickoPlayers = {};

var __getPlayer = function(alias) {
    var player = glickoPlayers[alias];
    return !player ? ranking.makePlayer() : player["glicko"];
};

var __buildGlickoMatch = function(match) {
    return [
        __getPlayer(match.home.player), __getPlayer(match.home.partner),
        __getPlayer(match.away.player), __getPlayer(match.away.partner),
        match.home.goals > match.away.goals ? 1 : match.home.goals < match.away.goals ? 0 : 0.5
    ];
};

/***
 * This method should be used to perform the initial ranking calculation based on the whole match history *
 * @param callback
 */
var calculateGeneralRanking = function(callback) {
    console.time("ranking calculation");

    schemas.Player.find(function(err, players) {
        if (err) res.send(err);
        _.each(players, function (player) {
            glickoPlayers[player.alias] = {
                glicko: ranking.makePlayer(settings.rating, settings.rd, settings.vol),
                model: player
            };
        });
        schemas.Match.find({$and: [{"home.goals": {$gt: -1}}, {"away.goals": {$gt: -1}}]}, function(err, matches) {
            _.each(matches, function(match) {
                console.log("team 1 : " + match.home.player + " " + match.home.partner);
                console.log("team 2 : " + match.away.player + " " + match.away.partner);
                ranking.updateRatings(__buildGlickoMatch(match));
                // TODO: we can only iterate the four participants of the match
                _.each(glickoPlayers, function (tuple) {
                    var player = tuple.glicko;
                    var h = (player.rankingHistory ||= []);
                    var newRanking = player.getRating().toFixed(2);
                    var lastRanking = h[h.length-1];
                    lastRanking = lastRanking == null ? null : lastRanking.ranking;
                    if (newRanking != lastRanking) {
                        h.push({
                            date: match.date,
                            match: match._id,
                            ranking: newRanking,
                            delta: newRanking - lastRanking
                        });
                    }
                });
            });
            

            console.timeEnd("ranking calculation");

            //save ranking...
            _.each(glickoPlayers, function(tuple) {
                __updateRankingDb(tuple);
            });
            callback.call(this, glickoPlayers);
        }).sort({"date": 1})

    });
};

var __updateRankingDb = function(tuple) {
    if (tuple) {
        var glickoPlayer = tuple.glicko;
        var newRankingValue = glickoPlayer.getRating().toFixed(2);
        schemas.Player.update({_id: tuple.model._id}, { $set: { ranking: newRankingValue, previousRanking: tuple.model.ranking, rankingHistory: glickoPlayer.rankingHistory } }, function(err, player) {
            if (err) console.error(err);
            console.log("new ranking for: " + tuple.model.alias + ", " + newRankingValue);
            console.log("old ranking for: " + tuple.model.alias + ", " + tuple.model.ranking);
        });
    }

};

module.exports = {
    calculateGeneralRanking: calculateGeneralRanking
};
