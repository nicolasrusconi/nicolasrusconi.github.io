controllers.controller('tournamentController', ['$scope', 'Data', "playersData", "matches", "tournament", function($scope, Data, playersData, matches, tournament){

    var addTagFilter = function(tag) {
        if ($scope.tagFilters.indexOf(tag) == -1) {
            $scope.tagFilters.push(tag);
        }
    };

    var selectPhase = function(phase) {
        $scope.tagFilters = [];
        $scope.players = [];
        $scope.thePhase = phase;
        addTagFilter(phase);
        $scope.calculateStandings();
    };

    $scope.calculateStandings = function() {
        var tournament = $scope.theTournament;
        var phase = $scope.thePhase;
        var matches = $scope.matches;
        if (!$scope.hasStandings(tournament, phase)) {
            return [];
        }

        var standingCalcFunction = getStandingsModel(tournament, phase);
        var standings = {};
        for (var i = matches.length - 1; i >= 0; i--) {
            var match = matches[i];
            if (match.phase == phase) {
                standingCalcFunction(standings, match.home, match.away.goals);
                standingCalcFunction(standings, match.away, match.home.goals);
            }

        }
        var positions = [];

        for (var key in standings) {
            positions.push(standings[key]);
        }
        positions.sort(comparePositions);
        $scope.positions = positions;
    };

    var initPosition = function(player, partner) {
        return {player: player, partner: partner,
            matchesPlayed:0, matchesWon:0, matchesTied:0, matchesLost:0,
            goalsScored:0, goalsReceived:0, goalsDiff: 0,
            points:0};
    };

    var processIndividualMatch = function(standings, player, goalsScored, goalsReceived) {
        var position = standings[player];
        if (!position) {
            position = initPosition(player);
            standings[player] = position;
        }
        return updatePosition(position, goalsScored, goalsReceived);
    };


    var updatePosition = function(position, goalsScored, goalsReceived) {
        if (goalsReceived != -1 && goalsScored != -1) {
            var won = goalsScored > goalsReceived ? 1 : 0;
            var lost = goalsScored < goalsReceived ? 1 : 0;
            var tied = goalsScored == goalsReceived ? 1 : 0;
            
            position.matchesPlayed += 1;
            position.matchesWon += won;
            position.matchesLost += lost;
            position.matchesTied += tied;

            position.goalsScored += goalsScored;
            position.goalsReceived += goalsReceived;
            position.goalsDiff = position.goalsScored - position.goalsReceived;

            position.points = position.points + (won * 3) + tied;
        }

        return position;
    };

    var comparePositions  = function(aPosition, anotherPosition) {
        var order = anotherPosition.points - aPosition.points;
        if (order == 0) {
            order = anotherPosition.goalsDiff - aPosition.goalsDiff;
            if (order == 0) {
                order = anotherPosition.goalsScored - aPosition.goalsScored;
            }
        }
        return order;
    };

    var getStandingsModel = function(theTournament) {
        var model = theTournament.config.standingsModel;
        var standingCalcFunction;
        switch(model) {
            case "Team":
                standingCalcFunction = function(standings, team, goalsReceived) {
                    var position = standings[team.team + team.player + team.partner];
                    if (!position) {
                        position = initPosition(team.player, team.partner);
                        position["team"] = team.team;
                        standings[team.team + team.player + team.partner] = position;
                    }

                    updatePosition(position, team.goals, goalsReceived);
                };
                break;
            case "Individual":
                standingCalcFunction = function(standings, team, goalsReceived) {
                    processIndividualMatch(standings, team.player, team.goals, goalsReceived);
                    if (team.partner) {
                        processIndividualMatch(standings, team.partner, team.goals, goalsReceived);
                    }
                };
                break;
            case "IndividualWithSupport":
                standingCalcFunction = function(standings, team, goalsReceived) {
                    var position = processIndividualMatch(standings, team.player, team.goals, goalsReceived);
                    position["team"] = team.team;
                };
                break;
            default:
                standingCalcFunction = function(){};
        }
        return standingCalcFunction;
    };

    $scope.hasStandings = function(theTournament, thePhase) {
        return theTournament ? theTournament.config.phasesWithStandings.indexOf(thePhase) != -1 : false;
    };

    $scope.getPicture = function(alias) {
        var player = $scope.playersInfo[alias];
        return player ? player.image : "images/icon.question.png";
    };

    $scope.$watch(function () { return Data.getCurrentPhase(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) selectPhase(newValue);
    });

    $scope.addPlayerTag = function(player) {
        if ($scope.players.indexOf(player) == -1) {
            $scope.players.push(player);
        }
    };
    $scope.removePlayerTag = function(player) {
        var index = $scope.players.indexOf(player);
        if (index != -1) {
            $scope.players.splice(index, 1);
        }
    };

    //Data
    $scope.players = [];
    $scope.tagFilters = [];
    $scope.playersInfo = {};

    $.each(playersData, function (index, player) {
        $scope.playersInfo[player.alias] = player;
    });
    $scope.matches = matches;
    $scope.filteredMatches = {};
    $scope.theTournament = tournament;
    Data.setCurrentTournament(tournament);
    if (tournament && tournament.config.defaultPhase) {
        selectPhase(tournament.config.defaultPhase);
    }
    $(".navbar-collapse").collapse('hide');
}])
    .filter('matchFilter', function() {
        return function(matches, filter) {
            var out = [];
            var index;
            if (filter.length == 0) {
                return matches;
            }
            for (index = 0; index < matches.length; ++index) {
                var match = matches[index];
                var hasAllPlayers = true;
                for (j = 0; j < filter.length && hasAllPlayers; ++j) {
                    hasAllPlayers = match.home.player == filter[j] || match.home.partner ==filter[j] ||
                    match.away.player == filter[j] || match.away.partner ==filter[j];
                }
                if (hasAllPlayers) {
                    out.push(match);
                }
            }
            return out;
        }
    })
    .filter('tournamentFilter', function() {
        return function(tournaments, filterKey) {
            var filter = [];
            $.each(tournaments, function(index, tournament) {
                filter.push(tournament[filterKey])
            });
            return filter;
        };
    })
    .filter('tagFilter', function() {
        var setResultsClass = function(match) {
            if (match.home.goals == -1) {
                match.clazz = "notPlayed";
            }
            if (match.home.goals > match.away.goals) {
                match.home.clazz = "won";
                match.away.clazz = "";
            } else if (match.home.goals < match.away.goals) {
                match.home.clazz = "";
                match.away.clazz = "won";
            }
        };
        return function(matches, tagFilter) {
            var out = [];
            if (tagFilter.length == 0 || (tagFilter.length == 1 && !tagFilter[0])) {
                return matches;
            }

            for (var index = 0; index < matches.length; ++index) {
                var match = matches[index];
                var hasAllTags = true;
                for (var j = 0; j < tagFilter.length && hasAllTags; ++j) {
                    hasAllTags = tagFilter[j] == match.tournament.name  || tagFilter[j] == match.phase;
                }
                if (hasAllTags) {
                    setResultsClass(match);
                    out.push(match);
                }
            }
            return out;
        }
    });