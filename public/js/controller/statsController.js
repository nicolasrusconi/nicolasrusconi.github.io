controllers.controller("statsController", ['$scope', 'allPlayerStats', 'playersData', function($scope, allPlayerStats, playersData) {

    var playersMap = {};
    $.each(playersData, function (index, player) {
        playersMap[player.alias] = player;
    });
    
    $scope.stats = [];
    var createStatTemplate = function(name, description) {
        return {
            name: name,
            description: description,
            list: [],
            pushValue: function(name, value) {
                this.list.push({name: name, value: value});
            }
        }
    };
    
    var scoredGoals = createStatTemplate("Pichichi", "Promedio de goles a favor");
    var receivedGoals = createStatTemplate("El goleado", "Promedio de goles en contra");
    var redCards = createStatTemplate("Premio chenemigo", "Promedio de tarjetas rojas");
    var mostPlayed = createStatTemplate("Vicio yo?", "El que mas partidos jugo");
    var tiedMatches = createStatTemplate("Deportivo empate", "Promedio de partidos empatados");
    var wonMatches = createStatTemplate("Este juega conmigo", "Promedio de victorias");

    $.each(allPlayerStats, function(playerName, stat) {
        var playerAttributes = playersMap[playerName];
        if (playerAttributes && playerAttributes.active !== false) {
            scoredGoals.pushValue(playerName, stat.goals.scored / stat.matches.played);
            receivedGoals.pushValue(playerName, stat.goals.received / stat.matches.played);
            redCards.pushValue(playerName, stat.cards.red.count / stat.cards.red.matches);
            mostPlayed.pushValue(playerName, stat.matches.played);
            tiedMatches.pushValue(playerName, stat.matches.tied / stat.matches.played);
            wonMatches.pushValue(playerName, stat.matches.won / stat.matches.played);
        }
    });

    function sortAndPush(stat) {
        stat.list = _.sortBy(stat.list, function (player) {
            return player.value ? -player.value : 0;
        });
        $scope.stats.push(stat);
    }
    
    _.each([scoredGoals, receivedGoals, redCards, mostPlayed, tiedMatches, wonMatches], function(stat) {
        sortAndPush(stat);
    });

}]);
