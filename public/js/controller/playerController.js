angular.module("fifa").controller("playerController",["$scope", "$http", function($scope, $http) {
    $http.get("/api/player")
        .success(function(data, status, headers, config) {
            $scope.players = data;
        }
    );
}]);
