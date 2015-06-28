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
                    controller: 'tournamentController'
                }).
                when("/stats", {
                    templateUrl: 'stats',
                    controller: 'tournamentController'
                }).
                otherwise({
                    redirectTo: '/'
                });
}])

.config(function($locationProvider) {
        $locationProvider.html5Mode(true).hashPrefix('!');
    })
;
