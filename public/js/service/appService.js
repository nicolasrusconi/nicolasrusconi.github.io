angular.module("fifa").service("tournamentService", ["$http", function($http) {
    this.getTournaments = function() {
        return $http.get("/api/tournament").then(function(data) {
            return data;
        });
    };
    this.getTournament = function(tournamentName) {
        return $http.get("/api/tournament/" + tournamentName).then(function(response) {
            return response.data;
        });
    }
}])
    .service("playerService", ["$http", function($http) {
        this.getPlayers = function() {
            return $http.get("/api/player").then(function(response) {
                return response.data;
            });
        }
    }])
    .service("matchService", ["$http", function($http) {
        this.getMatches = function(tournamentName) {
            return $http.get("/api/match/tournament/" + tournamentName).then(function(response) {
                return response.data;
            });

        };
        this.getMatchesForPlayer = function(username) {
            return $http.get("/api/match/player/" + username).then(function(response) {
                return response.data;
            });
        }
    }]);