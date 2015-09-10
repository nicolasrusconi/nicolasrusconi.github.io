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
                if (!isNaN(value) && value !== Infinity) {
                    this.list.push({name: name, value: value});
                }
            }
        }
    };
    
    var scoredGoals = createStatTemplate("Pichichi", "Promedio de goles a favor");
    var receivedGoals = createStatTemplate("El goleado", "Promedio de goles en contra (desc)");
    var lessReceivedGoals = createStatTemplate("Valla menos vencida", "Promedio de goles en contra (asc)");
    var redCards = createStatTemplate("Premio chenemigo", "Promedio de tarjetas rojas");
    var yellowCards = createStatTemplate("Premio chenemiguito", "Promedio de tarjetas amarillas");
    var terminator = createStatTemplate("Terminator", "Promedio de: rojas + amarillas/2");
    var fairPlay = createStatTemplate("Fair Play", "Promedio de: rojas + amarillas/2 (asc)");
    var mostPlayed = createStatTemplate("Vicio yo?", "El que mas partidos jugo");
    var tiedMatches = createStatTemplate("Deportivo empate", "Promedio de partidos empatados");
    var wonMatches = createStatTemplate("Victorias", "Promedio de victorias");
    

    $.each(allPlayerStats, function(playerName, stat) {
        var playerAttributes = playersMap[playerName];
        if (playerAttributes && playerAttributes.active !== false) {
            scoredGoals.pushValue(playerName, stat.goals.scored / stat.matches.played);
            receivedGoals.pushValue(playerName, stat.goals.received / stat.matches.played);
            lessReceivedGoals.pushValue(playerName, stat.goals.received / stat.matches.played);
            redCards.pushValue(playerName, stat.cards.red.count / stat.cards.red.matches);
            yellowCards.pushValue(playerName, stat.cards.yellow.count / stat.cards.yellow.matches);
            terminator.pushValue(playerName, (stat.cards.red.count / stat.cards.red.matches) + (0.5*stat.cards.yellow.count / stat.cards.yellow.matches) );
            fairPlay.pushValue(playerName, (stat.cards.red.count / stat.cards.red.matches) + (0.5*stat.cards.yellow.count / stat.cards.yellow.matches) );
            mostPlayed.pushValue(playerName, stat.matches.played);
            tiedMatches.pushValue(playerName, stat.matches.tied / stat.matches.played);
            wonMatches.pushValue(playerName, stat.matches.won / stat.matches.played);
        }
    });

    function sortAndPush(stat, order) {
        order = order >=0 ? 1 : -1;
        stat.list = _.sortBy(stat.list, function (player) {
            return player.value ? order * player.value : 0;
        });
        $scope.stats.push(stat);
    }
    
    _.each([scoredGoals, receivedGoals, redCards, yellowCards, terminator, mostPlayed, tiedMatches, wonMatches], function(stat) {
        sortAndPush(stat, -1);
    });

    _.each([lessReceivedGoals, fairPlay], function(stat) {
        sortAndPush(stat, 1);
    });

}]);
