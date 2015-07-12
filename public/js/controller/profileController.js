controllers.controller("profileController", ["$scope", "player", "matchesForPlayer", "playerStats", function($scope, player, matchesForPlayer, playerStats) {
    player.image = player.image.substring(0, player.image.lastIndexOf('?'));
    $scope.thePlayer = player;
    $scope.matchesForPlayer = matchesForPlayer;
    $scope.stats = playerStats;

}]);
