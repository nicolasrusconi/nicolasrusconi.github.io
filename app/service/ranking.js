var glicko2 = require("glicko2");
var _ = require("underscore");
var schemas = require("../model/schemas");

/**
 * A tuple is a Json object which contains glicko and model keys for glicko players and db players respectively.
 * Init the tuple, at the beginning of the ranking calculation each player will have the same ranking.  
 * @param players
 * @private
 */
var __initPlayersTuple = function (players) {
    var playersTuple = {};
    _.each(players, function (player) {
        // reset the ranking history
        player.rankingHistory = [];
        playersTuple[player.alias] = {
            glicko: ranking.makePlayer(),
            model: player
        };
    });
    return playersTuple;
};

var __updateRankingDb = function(tuple) {
    if (tuple) {
        var glickoPlayer = tuple.glicko;
        var model = tuple.model;
        var newRankingValue = glickoPlayer.getRating().toFixed(2);
        model.previousRanking = model.ranking;
        model.ranking = newRankingValue;
        model.save();
    }

};

var __updatePlayerRating = function(player, ratingBefore, ratingAfter) {
    if (player) {
        var rating = (ratingAfter.getRating() - ratingBefore.getRating()) / 2;
        player.setRating(player.getRating() + rating );
    }
};

var __getPlayer = function(playersTuple, alias) {
    var player = playersTuple[alias];
    return player ? player["glicko"] : null;
};

var __buildGlickoMatch = function(playersTuple, match) {
    return [
        __getPlayer(playersTuple, match.home.player), __getPlayer(playersTuple, match.home.partner),
        __getPlayer(playersTuple, match.away.player), __getPlayer(playersTuple, match.away.partner),
        match.home.goals > match.away.goals ? 1 : match.home.goals < match.away.goals ? 0 : 0.5
    ];
};

/**
 * Overriding the glicko2 updateRatings method, basically is a copy with some extra functionality that 
 * fits better for 2 vs 2 matches 
 * @param match
 */
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
    var virtualHomePlayer, virtualAwayPlayer;
    // single player or multiplayer?
    if (!homePartner && !awayPartner) {
        // creating virtual players since, if we use the players directly the deviation is higher.
        virtualHomePlayer = this.makePlayer(homePlayer.getRating());
        virtualAwayPlayer = this.makePlayer(awayPlayer.getRating());
    } else if (!homePartner || !awayPartner){
        console.error("something wrong happened, one of the partners is null");
        return;
    } else {
        //multiplayer, lets build a virtual player with rankings avg
        virtualHomePlayer = this.makePlayer(avg(homePlayer.getRating(), homePartner.getRating()));
        virtualAwayPlayer = this.makePlayer(avg(awayPlayer.getRating(), awayPartner.getRating()));
    }

    this.addResult(virtualHomePlayer, virtualAwayPlayer, matchResult);
    //save original players for future calculations...
    var oldVirtualHomePlayer = _.clone(virtualHomePlayer);
    var oldVirtualAwayPlayer = _.clone(virtualAwayPlayer);

    this.calculatePlayersRatings();
    console.log("Team 1 delta: " + (virtualHomePlayer.getRating() - oldVirtualHomePlayer.getRating()));
    console.log("Team 2 delta: " + (virtualAwayPlayer.getRating() - oldVirtualAwayPlayer.getRating()));
    //update all players involved...
    __updatePlayerRating(homePlayer, oldVirtualHomePlayer, virtualHomePlayer);
    __updatePlayerRating(homePartner, oldVirtualHomePlayer, virtualHomePlayer);
    __updatePlayerRating(awayPlayer, oldVirtualAwayPlayer, virtualAwayPlayer);
    __updatePlayerRating(awayPartner, oldVirtualAwayPlayer, virtualAwayPlayer);
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
    vol : 0.6
};

var ranking = new glicko2.Glicko2(settings);

/***
 * This method should be used to perform the initial ranking calculation based on the whole match history *
 * @param callback
 */
var calculateGeneralRanking = function(callback) {
    console.time("ranking calculation");

    schemas.Player.find(function(err, players) {
        if (err) {
            console.log(err);
        } else {
            var playersTuple = __initPlayersTuple(players);
            schemas.Match.find({$and: [{"home.goals": {$gt: -1}}, {"away.goals": {$gt: -1}}]}, function(err, matches) {
                _.each(matches, function(match) {
                    var homePlayer = match.home.player, homePartner = match.home.partner;
                    console.log("team 1 : " + homePlayer + " " + homePartner);
                    var awayPlayer = match.away.player, awayPartner = match.away.partner;
                    console.log("team 2 : " + awayPlayer + " " + awayPartner);
                    ranking.updateRatings(__buildGlickoMatch(playersTuple, match));
                    _.each([playersTuple[homePlayer], playersTuple[homePartner], playersTuple[awayPlayer], playersTuple[awayPartner]], function (tuple) {
                        if (tuple) {
                            var player = tuple.glicko;
                            var model = tuple.model;
                            var rankingHistory = model.rankingHistory;
                            var newRanking = player.getRating().toFixed(2);
                            var lastRanking = rankingHistory[rankingHistory.length-1];
                            lastRanking = lastRanking == null ? null : lastRanking.ranking;
                            console.log(model.alias + ": " + lastRanking + " > " + newRanking);
                            if (newRanking != lastRanking) {
                                rankingHistory.push({
                                    date: match.date,
                                    match: match._id,
                                    ranking: newRanking,
                                    delta: newRanking - lastRanking
                                });
                            }
                        }
                    });
                });
                console.timeEnd("ranking calculation");
                //save ranking...
                _.each(playersTuple, function(tuple) {
                    __updateRankingDb(tuple);
                });
                callback.call(this, playersTuple);
            }).sort({"date": 1})    
        }

    });
};

module.exports = {
    calculateGeneralRanking: calculateGeneralRanking
};
