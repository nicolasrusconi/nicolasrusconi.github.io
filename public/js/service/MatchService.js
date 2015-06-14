angular.module("fifa").service("matchService", ["$http", function($http) {
    this.getMatches = function() {
        return $http.get("/api/match").then(function(data) {
            return data;
        });
    }
}]);