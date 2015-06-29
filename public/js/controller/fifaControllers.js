var controllers = angular.module('fifaControllers', []);

controllers.factory('Data', function() {
    var currentTournament;
    var currentPhase;
    return {
        getCurrentTournament : function() {return currentTournament;},
        setCurrentTournament : function(tournament) {return currentTournament = tournament;},
        getCurrentPhase : function() {return currentPhase;},
        setCurrentPhase : function(phase) {return currentPhase = phase;}
    }

});

controllers.controller("playerController", ["$scope", "$http", "$location", "matchService", function($scope, $http, $location, matchService) {
    if ($location.path().lastIndexOf("profile") != -1) {
        $http.get("/api/player" + $location.path().substring($location.path().lastIndexOf("/")))
            .success(function(data, status, headers, config) {
                data.image = data.image.substring(0, data.image.lastIndexOf('?'));
                $scope.thePlayer = data;
                matchService.getMatchesForPlayer(data).then(function(response) {
                    $scope.calculateBasicStat(response.data);
                })
            }
        );
    }
    
    //FIXME: should be a better way to do this...
    $scope.calculateBasicStat = function(matches) {
        var alias = $scope.thePlayer.alias;
        $scope.thePlayer.matchesPlayed = matches.length;
        $scope.thePlayer.matchesWon = 0;
        $scope.thePlayer.matchesLost = 0;
        $scope.thePlayer.matchesTied = 0;
        $scope.thePlayer.goalsScored = 0;
        $scope.thePlayer.goalsReceived =0;
        $.each(matches, function(index, match) {
            var awayGoals = match.away.goals;
            var homeGoals = match.home.goals;
            if (awayGoals == -1 || homeGoals == -1) {
                return;
            }
            var homeWon = homeGoals > awayGoals ? 1 : 0;
            var tied = homeGoals == awayGoals ? 1 : 0;
            var awayWon = homeGoals < awayGoals ? 1 : 0;
            console.log(alias);
            var isHome = match.home.player == alias || match.home.partner == alias;
            $scope.thePlayer.matchesWon += isHome ? homeWon : awayWon;
            $scope.thePlayer.matchesLost += isHome ? awayWon : homeWon;
            $scope.thePlayer.matchesTied += tied;
            $scope.thePlayer.goalsScored += isHome ? homeGoals : awayGoals;
            $scope.thePlayer.goalsReceived += isHome ? awayGoals : homeGoals;
        });
        
    };
    
    
    $scope.goTo = function(player) {
        $location.path('/profile/' + player.username);
    };

    $http.get("/api/player")
        .success(function(data, status, headers, config) {
            $scope.players = data;
        }
    );
}]);

controllers.controller('modalController', function ($scope, $modal, $log) {

    $scope.animationsEnabled = true;

    $scope.open = function (match) {

        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'resultsEditor',
            controller: 'modalInstanceController',
            resolve: {
                match: function () {
                    return match;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

});

angular.module('fifa').controller('modalInstanceController', function ($scope, $modalInstance, match, $http) {

    $scope.match = match;


    $scope.ok = function () {
        $http.put("/api/match", match).success(function(response) {
            $modalInstance.close();
        }).error(
            $modalInstance.dismiss("error")
        )

    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});


controllers.controller('mainController', ['$scope', 'tournamentService', 'Data', function($scope, tournamentService, Data) {
    
    $scope.mainPage = function() {
        Data.setCurrentTournament(undefined);
    };
    
    $scope.logout = function() {
        window.location = '/account/logout';
    };
    
    tournamentService.getTournaments().then(function(response) {
        $scope.tournaments = response.data;
    });

    $scope.$watch(function () { return Data.getCurrentTournament(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.theTournament = newValue;
    });
    
    $scope.selectPhase = function(phase) {
        Data.setCurrentPhase(phase);
    }
}]);

controllers.controller('tournamentController', ['$scope', 'matchService', 'tournamentService', '$routeParams', 'Data', function($scope, matchService,tournamentService, $routeParams, Data){

    //Data
    $scope.players = [];
    $scope.tagFilters = [];
    
    matchService.getMatches($routeParams.tournamentName).then(function(response) {
        $scope.matches = response.data;
        tournamentService.getTournament($routeParams.tournamentName).then(function(response) {
            $scope.selectTournament(response.data);
        })
    });

    $scope.$watch(function () { return Data.getCurrentPhase(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.selectPhase(newValue);
    });

    $scope.addPlayer = function(player) {
        if ($scope.players.indexOf(player) == -1) {
            $scope.players.push(player);
        }
    };
    $scope.removePlayer = function(player) {
        var index = $scope.players.indexOf(player);
        if (index != -1) {
            $scope.players.splice(index, 1);
        }
    };
    $scope.addTagFilter = function(tag) {
        if ($scope.tagFilters.indexOf(tag) == -1) {
            $scope.tagFilters.push(tag);
        }
    };
    $scope.removeTagFilter = function(tag) {
        var index = $scope.tagFilters.indexOf(tag);
        if (index != -1) {
            $scope.tagFilters.splice(tag, 1);
        }
    };
    $scope.selectTournament = function(tournament) {
        $scope.theTournament = tournament;
        Data.setCurrentTournament(tournament);
        if (tournament && tournament.config.defaultPhase) {
            $scope.selectPhase(tournament.config.defaultPhase);
        }
    };
    $scope.selectPhase = function(phase) {
        $scope.tagFilters = [];
        $scope.players = [];
        $scope.thePhase = phase;
        $scope.addTagFilter(phase);
    };
    $scope.initPosition = function(player, partner) {
        return {
            player: player,
            partner: partner,
            matchesPlayed:0,
            matchesWon:0,
            matchesTied:0,
            matchesLost:0,
            goalsScored:0,
            goalsReceived:0,
            goalsDiff: 0,
            points:0
        };
    };

    $scope.processMatchTeam = function(standings, team, goalsReceived) {
        var position = standings[team.team + team.player + team.partner];
        if (!position) {
            position = $scope.initPosition(team.player, team.partner);
            position["team"] = team.team;
            standings[team.team + team.player + team.partner] = position;
        }

        $scope.updatePosition(position, team.goals, goalsReceived);
    };

    $scope.processMatchIndividualWithSupport = function(standings, team, goalsReceived) {
        var position = $scope.processIndividual(standings, team.player, team.goals, goalsReceived);
        position["team"] = team.team;
    };

    $scope.processMatchIndividual = function(standings, team, goalsReceived) {
        $scope.processIndividual(standings, team.player, team.goals, goalsReceived);
        $scope.processIndividual(standings, team.partner, team.goals, goalsReceived);
    };

    $scope.processIndividual = function(standings, player, goalsScored, goalsReceived) {
        var position = standings[player];
        if (!position) {
            position = $scope.initPosition(player);
            standings[player] = position;
        }
        return $scope.updatePosition(position, goalsScored, goalsReceived);
    };

    $scope.updatePosition = function(position, goalsScored, goalsReceived) {
        position.matchesPlayed = position.matchesPlayed + 1;

        var won = goalsScored > goalsReceived ? 1 : 0;
        position.matchesWon = position.matchesWon + won;

        var tied = goalsScored == goalsReceived ? 1 : 0;
        position.matchesTied = position.matchesTied + tied;

        var lost = goalsScored < goalsReceived ? 1 : 0;
        position.matchesLost = position.matchesLost + lost;

        position.goalsScored = position.goalsScored + goalsScored;
        position.goalsReceived = position.goalsReceived + goalsReceived;
        position.goalsDiff = position.goalsScored - position.goalsReceived;

        position.points = position.points + (won * 3) + tied;
        return position;
    };

    $scope.comparePositions  = function(aPosition, anotherPosition) {
        var order = anotherPosition.points - aPosition.points;
        if (order == 0) {
            order = anotherPosition.goalsDiff - aPosition.goalsDiff;
            if (order == 0) {
                order = anotherPosition.goalsScored - aPosition.goalsScored;
            }
        }
        return order;
    };
    $scope.standingsCache = {};

    $scope.calculateStandings  = function(tournament, phase, matches) {
        if (!$scope.hasStandings(tournament, phase)) {
            return [];
        }

        var positions = $scope.standingsCache[tournament.name + phase];
        if (positions) {
            return positions;
        }

        var standingCalcFunction = $scope.standingsModel(tournament, phase);
        var standings = {};
        for (var i = matches.length - 1; i >= 0; i--) {
            var match = matches[i];
            standingCalcFunction(standings, match.home, match.away.goals);
            standingCalcFunction(standings, match.away, match.home.goals);
        }
        positions = new Array();

        for (var key in standings) {
            positions.push(standings[key]);
        }
        positions.sort($scope.comparePositions);
        $scope.standingsCache[tournament.name + phase] = positions;
        return positions;
    };

    $scope.standingsModel = function(theTournament, thePhase) {
        var model = theTournament.config.standingsModel;
        var standingCalcFunction;
        switch(model) {
            case "Team":
                standingCalcFunction = $scope.processMatchTeam;
                break;
            case "Individual":
                standingCalcFunction = $scope.processMatchIndividual;
                break;
            case "IndividualWithSupport":
                standingCalcFunction = $scope.processMatchIndividualWithSupport;
                break;
            default:
                standingCalcFunction = function(){};
        }
        return standingCalcFunction;
    };

    $scope.hasStandings = function(theTournament, thePhase) {
        return theTournament ? theTournament.config.phasesWithStandings.indexOf(thePhase) != -1 : false;
    };

    $scope.homeResulsClass = function(match) {
        if (match.home.goals > match.away.goals) {
            return "won";
        } else if (match.home.goals < match.away.goals) {
            return "lost"
        } else {
            return "tie";
        }
    };
    $scope.awayResulsClass = function(match) {
        if (match.away.goals > match.home.goals) {
            return "won";
        } else if (match.away.goals < match.home.goals) {
            return "lost"
        } else {
            return "tie";
        }
    };
    
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
        return function(matches, tagFilter) {
            var out = [];
            var index = tagFilter.indexOf("Historico");
            if (index != -1) {
                tagFilter.splice("Historico", 1);
            }
            if (tagFilter.length == 0 || (tagFilter.length == 1 && !tagFilter[0])) {
                return matches;
            }

            for (index = 0; index < matches.length; ++index) {
                var match = matches[index];
                var hasAllTags = true;
                for (j = 0; j < tagFilter.length && hasAllTags; ++j) {
                    hasAllTags = tagFilter[j] == match.tournament.name  || tagFilter[j] == match.phase;
                }
                if (hasAllTags) {
                    out.push(match);
                }
            }
            return out;
        }
    });