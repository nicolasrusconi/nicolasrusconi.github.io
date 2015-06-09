angular.module("fifa")
    .controller("rankingController", ["$scope", "PlayersService", function($scope, playersService) {
        playersService.get().success(function(data) {
           $scope.players = data;
        });
}]);