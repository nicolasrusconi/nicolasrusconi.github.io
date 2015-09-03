controllers.controller('modalController', ["$scope", "$modal", "$log", "playerService", function ($scope, $modal, $log, playerService) {

    $scope.animationsEnabled = true;

    $scope.open = function (match) {

        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'resultsEditor',
            controller: 'modalInstanceController',
            resolve: {
                match: function () {
                    return match;
                },
                players: function() {
                    return playerService.getPlayers();
                }
            }
        });

        modalInstance.result.then(function () {
            $scope.calculateStandings();
            match.clazz = "";
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

}]);

angular.module('fifa').controller('modalInstanceController', function ($scope, $modalInstance, match, players, $http) {

    $scope.match = match;
    match.date = match.date ? new Date(match.date) : new Date();

    $scope.players = players;
    var playersMap = {};
    $.each(players, function(index, player) {
        playersMap[player.alias] = player;
    });
    $scope.getPicture = function(alias) {
        var player = playersMap[alias];
        return player ? player.image : "";
    };
    
    $scope.ok = function () {
        if (match._id) {
            $http.put("/api/match", match).success(function(response) {
                $modalInstance.close();
            }).error(function() {
                $modalInstance.dismiss("error")
            })
        } else {
            $http.post("/api/match", match).success(function(response) {
                $modalInstance.close();
            }).error(function() {
                $modalInstance.dismiss("error")
            })
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});