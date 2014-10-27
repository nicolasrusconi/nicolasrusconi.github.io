angular.module('fifa', [])
  .filter('matchFilter', function() {
    return function(matches, filter) {
      var out = [];
      var index;
      if (filter.length == 0) {
      	return matches;
      }
	  for (index = 0; index < matches.length; ++index) {
			var match = matches[index];
			var hasAllPlayers = true;
			for (j = 0; j < filter.length && hasAllPlayers; ++j) {
				hasAllPlayers = match.home.players.indexOf(filter[j]) != -1 
						 || match.away.players.indexOf(filter[j]) != -1;	
			}
			if (hasAllPlayers) {
				out.push(match);
	  		}
	  }
      return out;
    }
  })
  .filter('tagFilter', function() {
    return function(matches, tagFilter) {
      var out = [];
      var index;
      var index = tagFilter.indexOf("Historico");
  	  if (index != -1) {
  		tagFilter.splice("Historico", 1);	
  	  }
      if (tagFilter.length == 0 || (tagFilter.length == 1 && tagFilter[0] == "")) {
      	return matches;
      }

	  for (index = 0; index < matches.length; ++index) {
			var match = matches[index];
			var hasAllTags = true;
			for (j = 0; j < tagFilter.length && hasAllTags; ++j) {
				hasAllTags = match.tags.indexOf(tagFilter[j]) != -1;
			}
			if (hasAllTags) {
				out.push(match);
	  		}
	  }
      return out;
    }
  })
  .service('dataService',['$http', function ($http) {
  	this.t = $http.get('matches.json');
  }])
.controller('MainCtrl', ['$scope','dataService', function($scope, dataService){
	$scope.addPlayer = function(player) {
	if ($scope.players.indexOf(player) == -1) {
		$scope.players.push(player);
	}
	};
	$scope.removePlayer = function(player) {
		var index = $scope.players.indexOf(player);
		if (index != -1) {
			$scope.players.splice(index, 1);	
		}
	}
	$scope.addTagFilter = function(tag) {
		if ($scope.tagFilters.indexOf(tag) == -1) {
		$scope.tagFilters.push(tag);
	}
	}
	$scope.removeTagFilter = function(tag) {
		var index = $scope.tagFilters.indexOf(tag);
		if (index != -1) {
			$scope.tagFilters.splice(tag, 1);	
		}
	}
	$scope.selectTournament = function(tournament) {
		$scope.theTournament = tournament;
		var phase = $scope.tournamentsConfig[tournament].defaultPhase;
		if (!phase) {
			phase = '';
		}
		$scope.selectPhase(phase);
	}
	$scope.selectPhase = function(phase) {
		$scope.tagFilters = [];
		$scope.players = [];
		$scope.thePhase = phase;
		$scope.addTagFilter(phase);
	};
	$scope.initPosition = function(players) {
		return {
		  		players: players,
		  		matchesPlayed:0,
		  		matchesWon:0,
		  		matchesTied:0,
		  		matchesLost:0,
		  		goalsScored:0,
		  		goalsReceived:0,
		  		goalsDiff: 0,
		  		points:0,
	  		};
	}

	$scope.processMatchTeam = function(standings, team, goalsReceived) {
		var position = standings[team.team + team.players];
		if (!position) {
			position = $scope.initPosition(team.players);
			position["team"] = team.team;
			standings[team.team + team.players] = position;
		}

		$scope.updatePosition(position, team.goals, goalsReceived);
	}

	$scope.processMatchIndividualWithSupport = function(standings, team, goalsReceived) {
		var position = $scope.processIndividual(standings, team.players[0], team.goals, goalsReceived);	
		position["team"] = team.team;
	}

	$scope.processMatchIndividual = function(standings, team, goalsReceived) {
		$scope.processIndividual(standings, team.players[0], team.goals, goalsReceived);
		$scope.processIndividual(standings, team.players[1], team.goals, goalsReceived);
	}

	$scope.processIndividual = function(standings, player, goalsScored, goalsReceived) {
		var position = standings[player];
		if (!position) {
			position = $scope.initPosition([player]);
	  		standings[player] = position;
		}
		return $scope.updatePosition(position, goalsScored, goalsReceived);
	}

	$scope.updatePosition = function(position, goalsScored, goalsReceived) {
		position.matchesPlayed = position.matchesPlayed + 1;

		var won = goalsScored > goalsReceived ? 1 : 0;
		position.matchesWon = position.matchesWon + won;

		var tied = goalsScored == goalsReceived ? 1 : 0;
		position.matchesTied = position.matchesTied + tied;

		var lost = goalsScored < goalsReceived ? 1 : 0;
		position.matchesLost = position.matchesLost + lost;

		position.goalsScored = position.goalsScored + goalsScored;
		position.goalsReceived = position.goalsReceived + goalsReceived;
		position.goalsDiff = position.goalsScored - position.goalsReceived;

		position.points = position.points + (won * 3) + tied;
		return position;
	}

	$scope.comparePositions  = function(aPosition, anotherPosition) {
		var order = anotherPosition.points - aPosition.points;
		if (order == 0) {
			order = anotherPosition.goalsDiff - aPosition.goalsDiff;
			if (order == 0) {
				order = anotherPosition.goalsScored - aPosition.goalsScored;
			}
		}
		return order; 
	}
	$scope.standingsCache = {};

	$scope.calculateStandings  = function(tournament, phase, matches) {
		if (!$scope.hasStandings(tournament, phase)) {
			return [];
		}

		var positions = $scope.standingsCache[tournament + phase];
		if (positions) {
			return positions;
		}

		var standingCalcFunction = $scope.standingsModel(tournament, phase);
		var standings = {};
		for (var i = matches.length - 1; i >= 0; i--) {
			var match = matches[i];
			standingCalcFunction(standings, match.home, match.away.goals);
			standingCalcFunction(standings, match.away, match.home.goals);
		}
		positions = new Array();

		for (var key in standings) {
		    positions.push(standings[key]);
		}
		positions.sort($scope.comparePositions);
		$scope.standingsCache[tournament + phase] = positions;
		return positions;
	};

	$scope.standingsModel = function(theTournament, thePhase) {
		var model = $scope.tournamentsConfig[theTournament].standingsModel;
		var standingCalcFunction;
		switch(model) {
		    case "Team":
		        standingCalcFunction = $scope.processMatchTeam;
		        break;
		    case "Individual":
		        standingCalcFunction = $scope.processMatchIndividual;
		        break;
		    case "IndividualWithSupport":
		    	standingCalcFunction = $scope.processMatchIndividualWithSupport;
		        break;
		    default:
		    	standingCalcFunction = function(){};
		}
		return standingCalcFunction;
	};

	$scope.hasStandings = function(theTournament, thePhase) {
		return $scope.tournamentsConfig[theTournament].phasesWithStandings.indexOf(thePhase) != -1;
	};

 	//Data
 	$scope.tournaments =["Mundial 2", "Torneo 4", "Torneo 3", "Mundial 1", "Torneo 2", "Torneo 1", "Torneo 0", "Historico"];
	$scope.tournamentsConfig = {
		"Mundial 2" : {
			"phases" : ["Grupo A", "Grupo B", "Semifinales", "Final"],
			"defaultPhase" : "Grupo A",
			"phasesWithStandings" : ["Grupo A", "Grupo B"],
			"standingsModel" : "Team"
		},
		"Torneo 4" : {
			"phases" : ["Primera", "Segunda", "Tercera"],
			"defaultPhase" : "Primera",
			"phasesWithStandings" : ["Primera", "Segunda", "Tercera"],
			"standingsModel" : "Individual"
		},
		"Torneo 3" : {
			"phases" : ["Primera", "Segunda"],
			"defaultPhase" : "Primera",
			"phasesWithStandings" : ["Primera", "Segunda"],
			"standingsModel" : "Individual"
		},
		"Mundial 1" : {
			"phases" : ["Grupo A", "Grupo B", "Grupo C", "Grupo D", "Cuartos de final", "Semifinal", "Tercer Puesto", "Final"],
			"defaultPhase" : "Grupo A",
			"phasesWithStandings" : ["Grupo A", "Grupo B", "Grupo C", "Grupo D"],
			"standingsModel" : "IndividualWithSupport"
		},
		"Torneo 2" : {
			"phases" : ["Primera", "Segunda"],
			"defaultPhase" : "Primera",
			"phasesWithStandings" : ["Primera", "Segunda"],
			"standingsModel" : "Individual"
		},
		"Torneo 1" : {
			"phases" : ["Primera", "Segunda"],
			"defaultPhase" : "Primera",
			"phasesWithStandings" : ["Primera", "Segunda"],
			"standingsModel" : "Individual"
		}, 
		"Torneo 0" : {
			"phases" : ["Primera"],
			"defaultPhase" : "Primera",
			"phasesWithStandings" : ["Primera"],
			"standingsModel" : "Team"
		}, 
		"Historico" : {
			"phases" : [],
			"defaultPhase" : "",
			"phasesWithStandings" : [],
		},
	};

	$scope.players = [];
	$scope.tagFilters = [];
	$scope.selectTournament("Mundial 2");
	$scope.loadMatches = function () {
		return dataService.t;
	};
 	$scope.matches = [
	  {
	  	date:'',
	  	home: {
	  		players: ["Charly", "Juan"],
	  		team:"Inglaterra",
	  		goals: -1
	  	},
	  	away: {
	  		players: ["Hernan", "Gaby"],
	  		team:"Argentina",
	  		goals: -1
	  	},
	  	tags:["Mundial 2", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Charly", "Juan"],
	  		team:"Inglaterra",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["FerO", "Mauri"],
	  		team:"Francia",
	  		goals: 0
	  	},
	  	tags:["Mundial 2", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Charly", "Juan"],
	  		team:"Inglaterra",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Leandro", "Santi"],
	  		team:"Brasil",
	  		goals: 1
	  	},
	  	tags:["Mundial 2", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leandro", "Santi"],
	  		team:"Brasil",
	  		goals: 5
	  	},
	  	away: {
	  		players: ["FerO", "Mauri"],
	  		team:"Francia",
	  		goals: 2
	  	},
	  	tags:["Mundial 2", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leandro", "Santi"],
	  		team:"Brasil",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Hernan", "Gaby"],
	  		team:"Argentina",
	  		goals: 2
	  	},
	  	tags:["Mundial 2", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["FerO", "Mauri"],
	  		team:"Francia",
	  		goals: 1
	  	},
	  	away: {
	  		players: ["Hernan", "Gaby"],
	  		team:"Argentina",
	  		goals: 0
	  	},
	  	tags:["Mundial 2", "Grupo A"],
	  },
	  {
	  	date:'2014-10-06T18:00:00.000Z',
	  	home: {
	  		players: ["NicoR", "NicoL"],
	  		team:"Alemania",
	  		goals: 4
	  	},
	  	away: {
	  		players: ["Ariel", "Leo"],
	  		team:"Espana",
	  		goals: 1
	  	},
	  	tags:["Mundial 2", "Grupo B"],
	  },
	  {
	  	date:'2014-10-03T20:00:00.000Z',
	  	home: {
	  		players: ["NicoR", "NicoL"],
	  		team:"Alemania",
	  		goals: 4
	  	},
	  	away: {
	  		players: ["DaniG", "Malcom"],
	  		team:"Italia",
	  		goals: 0
	  	},
	  	tags:["Mundial 2",  "Grupo B"]
	  },
	  {
	  	date:'2014-10-03T20:00:00.000Z',
	  	home: {
	  		players: ["NicoR", "NicoL"],
	  		team:"Alemania",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Michu", "FerP"],
	  		team:"Holanda",
	  		goals: 0
	  	},
	  	tags:["Mundial 2", "Grupo B"],
	  },
	  {
	  	date:'2014-10-03T20:00:00.000Z',
	  	home: {
	  		players: ["Ariel", "Leo"],
	  		team:"Espana",
	  		goals: 1
	  	},
	  	away: {
	  		players: ["DaniG", "Malcom"],
	  		team:"Italia",
	  		goals: 1
	  	},
	  	tags:["Mundial 2", "Grupo B"]
	  },
	  	  {
	  	date:'2014-10-03T20:00:00.000Z',
	  	home: {
	  		players: ["Ariel", "Leo"],
	  		team:"Espana",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Michu", "FerP"],
	  		team:"Holanda",
	  		goals: 0
	  	},
	  	tags:["Mundial 2", "Grupo B"]
	  },
	  {
	  	date:'2014-10-03T20:00:00.000Z',
	  	home: {
	  		players: ["DaniG", "Malcom"],
	  		team:"Italia",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Michu", "FerP"],
	  		team:"Holanda",
	  		goals: 1
	  	},
	  	tags:["Mundial 2", "Grupo B"]
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leandro", "Santi"],
	  		team:"Brasil",
	  		goals: 3
	  	},
	  	away: {
	  		players: ["Leo", "Ariel"],
	  		team:"Espana",
	  		goals: 1
	  	},
	  	tags:["Mundial 2", "Semifinales"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Mauri", "Martin"],
	  		team:"Francia",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["NicoR", "NicoL"],
	  		team:"Alemania",
	  		goals: 1
	  	},
	  	tags:["Mundial 2", "Semifinales"],
	  },
	   {
	  	date:'',
	  	home: {
	  		players: ["Leandro", "Santi"],
	  		team:"Brasil",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Mauri", "Martin"],
	  		team:"Francia",
	  		goals: 0
	  	},
	  	tags:["Mundial 2", "Final"],
	  },
	   {
	  	date:'',
	  	home: {
	  		players: ["NicoR", "DaniG"],
	  		team:"",
	  		goals: 1
	  	},
	  	away: {
	  		players: ["Mauri", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
 	  {
	  	date:'',
	  	home: {
	  		players: ["Michu", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Leo", "Gaby"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	{
	  	date:'',
	  	home: {
	  		players: ["NicoR", "DaniG"],
	  		team:"",
	  		goals: 3
	  	},
	  	away: {
	  		players: ["Michu", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Mauri", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	away: {
	  		players: ["Leo", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["NicoR", "DaniG"],
	  		team:"",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Leo", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Mauri", "FerO"],
	  		team:"",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Michu", "Charly"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["NicoR", "DaniG"],
	  		team:"",
	  		goals: 1
	  	},
	  	away: {
	  		players: ["Malcom", "Gamba"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Mauri", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Malcom", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Michu", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Malcom", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leo", "Gaby"],
	  		team:"",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Malcom", "Gamba"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 0", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["NicoR", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	away: {
	  		players: ["Michu", "Mauri"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 1", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leo", "Michu"],
	  		team:"",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Gaby", "Mauri"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 1", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leo", "Mauri"],
	  		team:"",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["NicoR", "Michu"],
	  		team:"",
	  		goals: 4
	  	},
	  	tags:["Torneo 1", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leo", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	away: {
	  		players: ["NicoR", "Mauri"],
	  		team:"",
	  		goals: 4
	  	},
	  	tags:["Torneo 1", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Leo", "NicoR"],
	  		team:"",
	  		goals: 2
	  	},
	  	away: {
	  		players: ["Gaby", "Michu"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 1", "Primera"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Juan", "DaniG"],
	  		team:"",
	  		goals: 5
	  	},
	  	away: {
	  		players: ["FerO", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags:["Torneo 1", "Segunda"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["Juan", "DaniG"],
	  		team:"",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Charly", "Malcom"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags:["Torneo 1", "Segunda"],
	  },
	  {
	  	date:'',
	  	home: {
	  		players: ["FerO", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	away: {
	  		players: ["Charly", "Malcom"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags:["Torneo 1", "Segunda"],
	  },
	  {
	  	date:'2014-03-10T00:00:00.000Z',
	  	home:{
	  		players:["Mauri", "Michu"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Juan", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-11T00:00:00.000Z',
	  	home:{
	  		players:["Mauri", "Juan"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Michu", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-07T00:00:00.000Z',
	  	home:{
	  		players:["Mauri", "Charly"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Michu", "Juan"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-11T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Mauri"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Juan", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-06T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Juan"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Mauri", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-14T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Mauri", "Juan"],
	  		team:"",
	  		goals: 5
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-12T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Mauri"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Michu", "Juan"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-02-28T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Michu"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Mauri", "Juan"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-02-26T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Juan"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Mauri", "Michu"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-02-24T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Michu"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Juan", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-14T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Juan"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Michu", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-14T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Michu", "Juan"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-05T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Mauri"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Michu", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-05T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Michu"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Mauri", "Charly"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
	  {
	  	date:'2014-03-12T00:00:00.000Z',
	  	home:{
	  		players:["NicoR", "Charly"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Michu"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 2", "Primera"],
	  },
 	  {
	  	date:'2014-03-11T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Gamba"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["DaniG", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-07T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-07T00:00:00.000Z',
	  	home:{
	  		players:["DaniG", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-07T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Gamba"],
	  		team:"",
	  		goals: -1
	  	},
	  	away:{
	  		players:["DaniG", "Gaby"],
	  		team:"",
	  		goals: -1
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-11T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Gamba"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["DaniG", "Leo"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-02-28T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Gamba"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Gaby", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-14T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Leo", "FerO"],
	  		team:"",
	  		goals: 4
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-02-24T00:00:00.000Z',
	  	home:{
	  		players:["DaniG", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Malcom", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-13T00:00:00.000Z',
	  	home:{
	  		players:["DaniG", "FerO"],
	  		team:"",
	  		goals: -1
	  	},
	  	away:{
	  		players:["Malcom", "Leo"],
	  		team:"",
	  		goals: -1
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-06T00:00:00.000Z',
	  	home:{
	  		players:["DaniG", "FerO"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Gaby", "Gamba"],
	  		team:"",
	  		goals: 4
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-03-13T00:00:00.000Z',
	  	home:{
	  		players:["DaniG", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Leo", "Gamba"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-02-26T00:00:00.000Z',
	  	home:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Malcom", "DaniG"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-02-27T00:00:00.000Z',
	  	home:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Malcom", "FerO"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-02-25T00:00:00.000Z',
	  	home:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["DaniG", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'2014-02-27T00:00:00.000Z',
	  	home:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["FerO", "Gamba"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 2", "Segunda"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Mauri", "Juan"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Leo", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Mauri", "Leo"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Juan", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Mauri", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Juan", "Leo"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Mauri"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Leo", "Gaby"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Gaby"],
	  		team:"",
	  		goals: 6
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Gaby"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Mauri", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Mauri"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Juan", "Leo"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Juan"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Leo"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Juan"],
	  		team:"",
	  		goals: 4
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Juan"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Leo", "Gaby"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Leo"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Juan", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Juan", "Leo"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Mauri"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Juan", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Juan"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Gaby"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Gaby"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Mauri", "Juan"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 3", "Primera"],
	  },
	  {
	  	date:'2014-07-31T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Santi"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-08-01T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Santi"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Charly", "Hernan"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-30T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Charly", "Hernan"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-28T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Santi"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Michu", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-23T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Santi"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Michu", "Hernan"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-21T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Santi"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Charly", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-03T00:00:00.000Z',
	  	home:{
	  		players:["Malcom", "Santi"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Hernan", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-07T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Malcom", "Charly"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-24T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Malcom", "Hernan"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-22T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Charly", "Santi"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-10T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Hernan", "Santi"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-08T00:00:00.000Z',
	  	home:{
	  		players:["Charly", "Hernan"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Malcom", "Michu"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-11T00:00:00.000Z',
	  	home:{
	  		players:["Charly", "Hernan"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Malcom", "FerO"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-25T00:00:00.000Z',
	  	home:{
	  		players:["Charly", "Hernan"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Michu", "Santi"],
	  		team:"",
	  		goals: 7
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-07-25T00:00:00.000Z',
	  	home:{
	  		players:["Charly", "Hernan"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["FerO", "Santi"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 3", "Segunda"],
	  },
	  {
	  	date:'2014-09-02T00:00:00.000Z',
	  	home:{
	  		players:["Gaby", "Mauri"],
	  		team:"",
	  		goals: 6
	  	},
	  	away:{
	  		players:["Leo", "Malcom"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-09-02T00:00:00.000Z',
	  	home:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Malcom"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-26T00:00:00.000Z',
	  	home:{
	  		players:["Gaby", "Malcom"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Mauri", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-09-03T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Gaby"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Leo", "Malcom"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Leo"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Gaby", "Malcom"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-26T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Malcom"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 4
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-25T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Leo"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-09-05T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Mauri"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Gaby", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-27T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Gaby", "Mauri"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-22T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Mauri"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Leo", "Malcom"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-29T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Leo"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Mauri", "Malcom"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-09-04T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Malcom"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Mauri", "Leo"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-21T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Gaby"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Mauri", "Malcom"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-29T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Mauri"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Gaby", "Malcom"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Juan", "Malcom"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Gaby", "Mauri"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Primera"],
	  },
	  {
	  	date:'2014-08-21T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "NicoR"],
	  		team:"",
	  		goals: 7
	  	},
	  	away:{
	  		players:["FerO", "DaniG"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-27T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["NicoR", "DaniG"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-27T00:00:00.000Z',
	  	home:{
	  		players:["Michu", "DaniG"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["NicoR", "FerO"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-28T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "Michu"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["FerO", "DaniG"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-25T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Michu", "DaniG"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-28T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "DaniG"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-29T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "Michu"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["NicoR", "FerO"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-29T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "NicoR"],
	  		team:"",
	  		goals: 5
	  	},
	  	away:{
	  		players:["Michu", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-26T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "FerO"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Michu", "NicoR"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "NicoR"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["FerO", "DaniG"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-29T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "FerO"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["NicoR", "DaniG"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "DaniG"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["NicoR", "FerO"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-09-02T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "Michu"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["NicoR", "DaniG"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-09-03T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "NicoR"],
	  		team:"",
	  		goals: 5
	  	},
	  	away:{
	  		players:["Michu", "DaniG"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-09-02T00:00:00.000Z',
	  	home:{
	  		players:["Santi", "DaniG"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Michu", "NicoR"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Segunda"],
	  },
	  {
	  	date:'2014-08-20T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "Ariel"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Leandro", "NicoL"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-20T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "Ariel"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Charly", "FerP"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-20T00:00:00.000Z',
	  	home:{
	  		players:["Leandro", "NicoL"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Charly", "FerP"],
	  		team:"",
	  		goals: 3
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-21T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "NicoL"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Leandro", "FerP"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-22T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "NicoL"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Charly", "Ariel"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-22T00:00:00.000Z',
	  	home:{
	  		players:["Leandro", "FerP"],
	  		team:"",
	  		goals: 4
	  	},
	  	away:{
	  		players:["Charly", "Ariel"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-25T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "FerP"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Charly", "NicoL"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-25T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "FerP"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Leandro", "Ariel"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-25T00:00:00.000Z',
	  	home:{
	  		players:["Charly", "NicoL"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Leandro", "Ariel"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-26T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "Ariel"],
	  		team:"",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Leandro", "FerP"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-27T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "Ariel"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Charly", "NicoL"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-27T00:00:00.000Z',
	  	home:{
	  		players:["Leandro", "FerP"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Charly", "NicoL"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-08-29T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "FerP"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Leandro", "NicoL"],
	  		team:"",
	  		goals: 2
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "FerP"],
	  		team:"",
	  		goals: 8
	  	},
	  	away:{
	  		players:["Charly", "Ariel"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Leandro", "NicoL"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Charly", "Ariel"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "NicoL"],
	  		team:"",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Charly", "FerP"],
	  		team:"",
	  		goals: 1
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-09-01T00:00:00.000Z',
	  	home:{
	  		players:["Hernan", "NicoL"],
	  		team:"",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Leandro", "Ariel"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'2014-09-05T00:00:00.000Z',
	  	home:{
	  		players:["Charly", "FerP"],
	  		team:"",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Leandro", "Ariel"],
	  		team:"",
	  		goals: 0
	  	},
	  	tags: ["Torneo 4", "Tercera"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Leo"],
	  		team:"Alemania",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Santi", "Gaby"],
	  		team:"Francia",
	  		goals: 3
	  	},
	  	tags: ["Mundial 1", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Malcom"],
	  		team:"Alemania",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Gamba", "Leo"],
	  		team:"Mexico",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "DaniG"],
	  		team:"Alemania",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Michu", "Juan"],
	  		team:"Inglaterra",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Michu", "FerO"],
	  		team:"Inglaterra",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Gamba", "Gaby"],
	  		team:"Mexico",
	  		goals: 4
	  	},
	  	tags: ["Mundial 1", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Michu", "Gaby"],
	  		team:"Inglaterra",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Santi", "DaniG"],
	  		team:"Francia",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Gamba", "Mauri"],
	  		team:"Mexico",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Santi", "Leo"],
	  		team:"Francia",
	  		goals: 2
	  	},
	  	tags: ["Mundial 1", "Grupo A"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Leo", "Mauri"],
	  		team:"Italia",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Gaby", "Gamba"],
	  		team:"Brasil",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Grupo B"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Leo", "Gamba"],
	  		team:"Italia",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Malcom", "Santi"],
	  		team:"Espana",
	  		goals: 2
	  	},
	  	tags: ["Mundial 1", "Grupo B"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Leo", "Santi"],
	  		team:"Italia",
	  		goals: 0
	  	},
	  	away:{
	  		players:["FerO", "Mauri"],
	  		team:"Uruguay",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Grupo B"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Gaby", "Mauri"],
	  		team:"Brasil",
	  		goals: 7
	  	},
	  	away:{
	  		players:["Malcom", "Charly"],
	  		team:"Espana",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Grupo B"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Gaby", "Charly"],
	  		team:"Brasil",
	  		goals: 2
	  	},
	  	away:{
	  		players:["FerO", "NicoR"],
	  		team:"Uruguay",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Grupo B"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Malcom", "Mauri"],
	  		team:"Espana",
	  		goals: 2
	  	},
	  	away:{
	  		players:["FerO", "Santi"],
	  		team:"Uruguay",
	  		goals: 2
	  	},
	  	tags: ["Mundial 1", "Grupo B"],
	  },

	  {
	  	date:'',
	  	home:{
	  		players:["Mauri", "Gamba"],
	  		team:"Holanda",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Juan", "Michu"],
	  		team:"CdMarfil",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Grupo C"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Mauri", "Leo"],
	  		team:"Holanda",
	  		goals: 4
	  	},
	  	away:{
	  		players:["DaniG", "NicoR"],
	  		team:"Colombia",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Grupo C"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Juan", "Malcom"],
	  		team:"CdMarfil",
	  		goals: 4
	  	},
	  	away:{
	  		players:["DaniG", "Leo"],
	  		team:"Colombia",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Grupo C"],
	  },

	  {
	  	date:'',
	  	home:{
	  		players:["Charly", "Santi"],
	  		team:"EEUU",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Cristian", "NicoR"],
	  		team:"Argentina",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Grupo D"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Charly", "NicoR"],
	  		team:"EEUU",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Sebas", "Leo"],
	  		team:"Portugal",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Grupo D"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Cristian", "Leo"],
	  		team:"Argentina",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Sebas", "Malcom"],
	  		team:"Portugal",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Grupo D"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Santi", "Leo"],
	  		team:"Francia",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Juan", "Gaby"],
	  		team:"CdMarfil",
	  		goals: 4
	  	},
	  	tags: ["Mundial 1", "Cuartos de final"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Cristian", "NicoR"],
	  		team:"Argentina",
	  		goals: 0
	  	},
	  	away:{
	  		players:["Leo", "Juan"],
	  		team:"Italia",
	  		goals: 3
	  	},
	  	tags: ["Mundial 1", "Cuartos de final"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Mauri", "Leo"],
	  		team:"Holanda",
	  		goals: 2
	  	},
	  	away:{
	  		players:["NicoR", "Gaby"],
	  		team:"Alemania",
	  		goals: 5
	  	},
	  	tags: ["Mundial 1", "Cuartos de final"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["Gaby", "NicoR"],
	  		team:"Brasil",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Charly", "Mauri"],
	  		team:"EEUU",
	  		goals: 1
	  	},
	  	tags: ["Mundial 1", "Cuartos de final"],
	  },
  	  {
	  	date:'',
	  	home:{
	  		players:["Juan", "Santi"],
	  		team:"CdMarfil",
	  		goals: 3,
	  		penalties: 4,
	  	},
	  	away:{
	  		players:["Leo", "NicoR"],
	  		team:"Italia",
	  		goals: 3,
	  		penalties: 5,
	  	},
	  	tags: ["Mundial 1", "Semifinal"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Santi"],
	  		team:"Alemania",
	  		goals: 3
	  	},
	  	away:{
	  		players:["Gaby", "Juan"],
	  		team:"Brasil",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Semifinal"],
	  },

	  {
	  	date:'',
	  	home:{
	  		players:["Juan", "Leo"],
	  		team:"CdMarfil",
	  		goals: 1
	  	},
	  	away:{
	  		players:["Gaby", "Mauri"],
	  		team:"Brasil",
	  		goals: 4
	  	},
	  	tags: ["Mundial 1", "Tercer Puesto"],
	  },
	  {
	  	date:'',
	  	home:{
	  		players:["NicoR", "Malcom"],
	  		team:"Alemania",
	  		goals: 2
	  	},
	  	away:{
	  		players:["Leo", "Mauri"],
	  		team:"Italia",
	  		goals: 0
	  	},
	  	tags: ["Mundial 1", "Final"],
	  },
  ];
}])
;

