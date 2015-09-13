controllers = angular.module('fifaControllers', []);

controllers.factory('Data', function() {
    var currentTournament;
    var currentPhase;
    return {
        getCurrentTournament : function() {return currentTournament;},
        setCurrentTournament : function(tournament) {return currentTournament = tournament;},
        getCurrentPhase : function() {return currentPhase;},
        setCurrentPhase : function(phase) {return currentPhase = phase;}
    }

});

controllers.controller('mainController', ['$scope', 'tournamentService', 'Data', function($scope, tournamentService, Data) {

    $scope.mainPage = function() {
        Data.setCurrentTournament(undefined);
    };

    $scope.logout = function() {
        window.location = '/account/logout';
    };
    
    $scope.signIn = function() {
        window.location = "/login";
    };

    tournamentService.getTournaments().then(function(response) {
        $scope.tournaments = response.data;
    });

    $scope.$watch(function () { return Data.getCurrentTournament(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.theTournament = newValue;
    });

    $scope.selectPhase = function(phase) {
        Data.setCurrentPhase(phase);
        $scope.thePhase = phase;
    }
}]);