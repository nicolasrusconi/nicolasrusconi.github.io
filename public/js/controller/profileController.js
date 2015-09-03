controllers.controller("profileController", ["$scope", "$location", "player", "matchesForPlayer", "playerStats", "playersData", function($scope, $location, player, matchesForPlayer, playerStats, playersData) {
    player.image = player.image.substring(0, player.image.lastIndexOf('?'));
    $scope.thePlayer = player;
    $scope.matchesForPlayer = matchesForPlayer;
    var indexedMatches = _.indexBy(matchesForPlayer, '_id');
    $scope.stats = playerStats;
    $scope.history = _.map(player.rankingHistory || [], function(h) {
        h.match = indexedMatches[h.match];
        return h;
    });

    $scope.getPicture = function(alias) {
        var player = $scope.playersMap[alias];
        return player ? player.image : "images/icon.question.png";
    };

    $scope.playersMap = {};

    $.each(playersData, function (index, player) {
        $scope.playersMap[player.alias] = player;
    });

    $scope.goTo = function(player) {
        $location.path('/profile/' + player);
    };


}]);
