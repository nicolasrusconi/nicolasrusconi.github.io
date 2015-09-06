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
    if (!match.home) {
        match.home = {};
        match.home.goals = match.home.redCards = match.home.yellowCards = 0;
    }
    if (!match.away){
        match.away = {};
        match.away.goals = match.away.redCards = match.away.yellowCards = 0;
    }
    
    
    match.date = match.date ? new Date(match.date) : new Date();

    $scope.players = players;
    $scope.playeropts = _.pluck(players, 'alias');
    var playersMap = {};
    $.each(players, function(index, player) {
        playersMap[player.alias] = player;
    });

    $scope.ok = function () {

        //FIXME: use select2 and angular properly
        match.home.player = $("#homePlayer").val().replace("string:","");
        match.home.partner = $("#homePartner").val().replace("string:","");
        match.away.player = $("#awayPlayer").val().replace("string:","");
        match.away.partner = $("#awayPartner").val().replace("string:","");
        match.home.team = $("#homeTeam").val();
        match.away.team = $("#awayTeam").val();

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
}).directive('initPlayerSelect', function() {
    return function(scope, element, attrs) {
        // FIXME use angular properly
        _.delay(function() { 
            $(element).select2({placeholder: "Select a player"})
        });
    }

}).directive('initTeamSelect', function() {
    //FIXME: remove this directive, we should have the teams in the db
    return function($scope, element, attrs) {
        var data = [
            {id: "RealMadrid", text: "Real Madrid"},
            {id: "Barcelona", text: "Barcelona"},
            {id: "Chelsea", text:"Chelsea"},
            {id: "PSG", text:"PSG"},
            {id: "Bayern", text:"Bayern Munich"},
            {id: "Borussia", text:"Borussia Dortmund"},
            {id: "ManUtd", text:"Manchester United"},
            {id: "ManCity", text:"Manchester City"},
            {id: "Juventus", text:"Juventus"},
            {id: "Argentina", text:"Argentina"},
            {id: "Alemania", text:"Alemania"},
            {id: "Brasil", text:"Brasil"},
            {id: "Espana", text:"Espana"},
            {id: "Francia", text:"Francia"},
            {id: "Holanda", text:"Holanda"},
            {id: "Inglaterra", text:"Inglaterra"},
            {id: "Italia", text:"Italia"},
            {id: "Mexico", text:"Mexico"},
            {id: "Uruguay", text:"Inglaterra"},
            {id: "Colombia", text:"Colombia"},
            {id: "CDMarfil", text:"Costa de Marfil"},
            {id: "EEUU", text:"EEUU"},
            {id: "Portugal", text:"Portugal"},
            {id: "Peru", text:"Peru"},
            {id: "Ecuador", text:"Ecuador"},
            {id: "Chile", text:"Chile"},
            {id: "Venezuela", text:"Venezuela"},
            {id: "Paraguay", text:"Paraguay"},
            {id: "Bolivia", text:"Bolivia"},
            {id: "Gales", text:"Gales"},
            {id: "Australia", text:"Australia"},
            {id: "Korea", text:"Corea del sur"}
        ];
        $(element).select2({
            placeholder: "Select a team",
            data: data,
            allowClear: true
        });
        var homeOrAway = $(element).attr('ng-model').split(".")[1];
        var team = $scope.match[homeOrAway].team;
        if (team) {
            $(element).val(team);
            $(element).select2().val(team);
        }

        
    }
});