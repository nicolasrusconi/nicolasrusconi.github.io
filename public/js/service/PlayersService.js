angular.module("fifa", []).factory("PlayersService", ["$http", function($http) {
    return {
        get: function() {
            return $http.get("/api/players");
        }
    }
}]);