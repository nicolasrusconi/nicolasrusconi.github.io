angular.module("fifa").service("tournamentService", ["$http", function($http) {
    this.getTournaments = function() {
        return $http.get("/api/tournament").then(function(data) {
            return data;
        });
    }
}]);