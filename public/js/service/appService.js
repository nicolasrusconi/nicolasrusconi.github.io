angular.module("fifa").service("tournamentService", ["$http", function($http) {
    this.getTournaments = function() {
        return $http.get("/api/tournament").then(function(data) {
            return data;
        });
    }
}])
    .service("matchService", ["$http", function($http) {
        this.getMatches = function() {
            return $http.get("/api/match").then(function(data) {
                return data;
            });
        }
    }]);