controllers.controller("rankingController", ["$scope", "$location", "Data", "players", function($scope, $location, Data, players) {
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
    
}]);
