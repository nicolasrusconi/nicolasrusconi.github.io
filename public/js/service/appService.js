angular.module("fifa").service("tournamentService", ["$http", function($http) {
    this.getTournaments = function() {
        return $http.get("/api/tournament").then(function(data) {
            return data;
        });
    };
    this.getTournament = function(tournamentName) {
        return $http.get("/api/tournament/" + tournamentName).then(function(data) {
            return data;
        });
    }
}])
    .service("matchService", ["$http", function($http) {
        this.getMatches = function() {
            return $http.get("/api/match").then(function(data) {
                return data;
            });
        };
        this.getMatches = function(tournamentName) {
            return $http.get("/api/match/tournament/" + tournamentName).then(function(data) {
                return data;
            });

        };
        this.getMatchesForPlayer = function(player) {
            return $http.get("/api/match/player/" + player.alias).then(function(data) {
                return data;
            });
        }
    }]);