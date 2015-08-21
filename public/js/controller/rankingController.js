controllers.controller("rankingController", ["$scope", "$location", "$http", "Data", "players", "allPlayerStats", function($scope, $location, $http, Data, players, allPlayerStats) {
    Data.setCurrentTournament(undefined);
    
    $scope.updateRanking = function() {
        if(confirm("Estas seguro?")) {
            $http.post("/api/player/ranking").success(function() {
                $location.path("/");
            });
        }
    };

    $scope.goTo = function(player) {
        $location.path('/profile/' + player.alias);
    };
    
    $scope.players = players;
    
    $.each(players, function(index, player) {
        var allPlayerStat = allPlayerStats[player.alias];
        player.matchesPlayed = allPlayerStat ? allPlayerStat.matches.played : 0;
        player.wonAvg = allPlayerStat ? (100 * (allPlayerStat.matches.won / allPlayerStat.matches.played)).toFixed(2) : 0;
        player.tiedAvg = allPlayerStat ? (100 * (allPlayerStat.matches.tied / allPlayerStat.matches.played)).toFixed(2) : 0;
        player.lostAvg = allPlayerStat ? (100 * (allPlayerStat.matches.lost / allPlayerStat.matches.played)).toFixed(2) : 0;
        var previous = player.rankingHistory[player.rankingHistory.length - 2] || {};
        player.delta = (player.ranking || 0) - (previous.ranking || 0)
    })
    
}]);
