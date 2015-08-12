controllers.controller('modalController', function ($scope, $modal, $log) {

    $scope.animationsEnabled = true;

    $scope.open = function (match) {

        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'resultsEditor',
            controller: 'modalInstanceController',
            resolve: {
                match: function () {
                    return match;
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

});

angular.module('fifa').controller('modalInstanceController', function ($scope, $modalInstance, match, $http) {

    $scope.match = match;
    match.date = match.date ? new Date(match.date) : new Date();

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