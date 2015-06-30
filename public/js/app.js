angular.module('fifa', ['ngRoute', 'ui.bootstrap', 'fifaControllers'])

.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/ranking', {
                    templateUrl: 'ranking',
                    controller: 'playerController'
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
                    templateUrl: 'stats',
                    controller: 'tournamentController'
                }).
                when("/profile/:username",{
                    templateUrl: 'profile',
                    controller: 'playerController'
                }).
                otherwise({
                    redirectTo: '/'
                });
}])

.config(function($locationProvider) {
        $locationProvider.html5Mode(true).hashPrefix('!');
    })
;
