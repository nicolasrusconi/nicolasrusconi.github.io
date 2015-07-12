var schemas = require("../model/schemas");
var _ = require("underscore");
var players = {};

var playerStatistics = function(alias) {
    return players[alias];
};

var updateForPlayer = function(playersArray) {
    _.each(playersArray, function(alias) {
        players[alias] = __createBasicModel(); //force recalculation
    });
    getAllMatches(function(matches) {
        _.each(matches, function(match) {
            if (match.home.goals == -1 ) return; //FIXME: filter -1 -1
            __collectBasicStat(match, function(alias) {
                return playersArray.indexOf(alias) != -1
            });
        })
    })
};

var getAllMatches = function (callback) {
    schemas.Match.find({}, function(err, matches) {
        if (err) {
            console.log(err);
        } else {
            callback.call(this, matches);
        }
    });
};

// initialize
getAllMatches(function(matches) {
    _.each(matches, function(match) {
        if (match.home.goals == -1 ) return; //FIXME: filter -1 -1
        __collectBasicStat(match);
    });
});

var __createBasicModel = function(){
    return {
        matches: {
            played:0,
            won: 0,
            lost: 0,
            tied: 0
        },
        goals: {
            received: 0,
            scored: 0
        },
        cards: {
            red: {
                matches: 0,
                count: 0
            },
            yellow: {
                matches: 0,
                count: 0
            }
        }
    };
};


var __getGoals = function(match) {
    return {
        home: match.home.goals,
        away: match.away.goals
    }
};

var __getCards = function(match) {
    var homeYellow = match.home.yellowCards;
    var awayYellow = match.away.yellowCards;
    var homeRed = match.home.redCards;
    var awayRed = match.away.redCards;
    if (homeYellow != -1 && awayYellow != -1 && homeRed != -1 && awayRed != -1) {
        return {
            "home": {"yellow": homeYellow, "red": homeRed},
            "away": {"yellow": awayYellow, "red": awayRed}
        }
    }
    return null;
};

var __verify = function(alias) {
    if (alias && !players[alias]) {
        players[alias] = __createBasicModel();
    }
};

var __addPlayerMatch = function(alias, won, lost, tied) {
    var matchesStat = players[alias].matches;
    matchesStat.played += 1;
    matchesStat.won += won;
    matchesStat.lost += lost;
    matchesStat.tied += tied;
};

var __addPlayerGoals = function(alias, scored, received) {
    players[alias].goals.scored += scored;
    players[alias].goals.received += received;
};

var __addPlayerCards = function(alias, yellowCards, redCards) {
    players[alias].cards.red.count += redCards;
    players[alias].cards.red.matches += 1;
    players[alias].cards.yellow.count += yellowCards;
    players[alias].cards.yellow.matches += 1;
};

var __collectBasicStat = function(match, playerFilter) {
    
    if (!playerFilter) playerFilter = function() {return true};
    
    var matchPlayers = {"home": [match.home.player, match.home.partner], "away": [match.away.player, match.away.partner]};

    var cards = __getCards(match);
    
    var goals = __getGoals(match);
    var homeWon = goals.home > goals.away ? 1 : 0;
    var homeLost = goals.home < goals.away ? 1 : 0;
    var homeTied = goals.home == goals.away ? 1 : 0;

    
    
    _.each(matchPlayers, function(matchTeam, index) {
        _.each(matchTeam, function(player) {
            if (playerFilter(player) && player) {
                __verify(player);
                switch (index){
                    case "home":
                        __addPlayerMatch(player, homeWon, homeLost, homeTied);
                        __addPlayerGoals(player, goals.home, goals.away);

                        break;
                    case "away":
                        __addPlayerMatch(player, homeLost, homeWon, homeTied);
                        __addPlayerGoals(player, goals.away, goals.home);
                        break;
                    default: throw new Error("invalid state");
                }
                if (cards) {
                    __addPlayerCards(player, cards[index].yellow, cards[index].red);
                }
            }
        });
    });
};

module.exports = {
    playerStatistics: playerStatistics,
    updateForPlayer: updateForPlayer
};
