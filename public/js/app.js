var app = angular.module('fifa', ['ngRoute', 'ui.bootstrap', 'fifaControllers'])

.config(['$routeProvider', "$locationProvider",
        function($routeProvider, $locationProvider) {
            $routeProvider.
                when('/ranking', {
                    templateUrl: 'ranking',
                    controller: 'playerController',
                    resolve: {
                        matchesForPlayer: function() {return []},
                        playerStats: function() {
                            return [];

                        }
                    }
                }).
                when('/tournament/:tournamentName', {
                    templateUrl: 'tournament',
                    controller: 'tournamentController',
                    resolve: {
                        playersData: function(playerService) {
                            return playerService.getPlayers();
                        },
                        matches:  function($route, matchService) {
                            return matchService.getMatches($route.current.params.tournamentName);
                        },
                        tournament: function($route, tournamentService) {
                            return tournamentService.getTournament($route.current.params.tournamentName);
                        }
                    }
                }).
                when("/stats", {
                    templateUrl: 'stats'
                }).
                when("/profile/:alias",{
                    templateUrl: 'profile',
                    controller: 'playerController',
                    resolve: {
                        matchesForPlayer: function($route, matchService) {
                            return matchService.getMatchesForPlayer($route.current.params.alias);
                        },
                        playerStats: function($route, playerService) {
                            return playerService.getPlayerStats($route.current.params.alias)
                            
                        }
                    }
                }).
                when('/rules', {
                    templateUrl: 'rules'
                }).
                otherwise({
                    redirectTo: '/tournament/current'
                });
            $locationProvider.html5Mode(true);
}]);
