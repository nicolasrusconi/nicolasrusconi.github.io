angular.module("fifa").service("matchService", ["$http", function($http) {
    this.matches = $http.get("/api/match");
}]);