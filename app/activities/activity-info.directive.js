angular
	.module('fireTeam.activity')
	.controller('activityInfoCtrl', activityInfoCtrl)
	.directive('activityInfo', activityInfo);

	activityInfo.$inject = ['$rootScope', '$timeout', '$window'];

	function activityInfo($rootScope, $timeout, $window) {
		return {
			restrict: 'E',
			scope: {
				activityInfo: '='
			},
			templateUrl: '/activities/activity-info.html',
			controller: activityInfoCtrl,
			controllerAs: 'ctrl',
			transclude: true,
			replace: true,
			link: function(scope, element, attrs, ctrl){
				scope.isLoadingCarnageReport = false;
				scope.chartModel = {};
				scope.activityMembers = {};
				scope.isShowRankings = true;
				scope.isShowTable = true;
				scope.const = $rootScope.const;
				scope.tableClickEvnt = null;

				angular.element($window).on('click', function(e){
					if(scope.tableClickEvnt){
						e.stopPropagation();
						scope.tableClickEvnt = null;
						return;
					}
					scope.clearTableSelection();
					scope.$apply();
				});

				angular.element(element).on('click', function(e){
					scope.tableClickEvnt = e;
				});

				scope.$watch('activityInfo', function(newVal){
					if(newVal){
						getFireTeam();
					}
				});

				function getFireTeam(){
					scope.activityMembers = {};
					scope.isLoadingCarnageReport = true;
					scope.chartModel = createChartModel();
					scope.scrollToTable();
				}

				function createChartModel(){
					var tableObj = {};
					var activityMembers = Object.keys(scope.activityInfo.playerPostGameCarnageReport);

					angular.forEach(activityMembers, function(player){
						var object = scope.activityInfo.playerPostGameCarnageReport[player].characterInfo;
						object.isSearchedPlayer = scope.activityInfo.playerPostGameCarnageReport[player].isSearchedPlayer;
						angular.extend(object, scope.activityInfo.playerPostGameCarnageReport[player].playerInfo)
						scope.activityMembers[player] = object;
					});

					angular.forEach(scope.activityInfo.playerPostGameCarnageReport, function(player){
						angular.forEach(player, function(statTopicVal, statTopicKey){
							if(statTopicKey !== 'playerInfo' && statTopicKey !== 'characterInfo'){
								if(!tableObj[statTopicKey]){
									tableObj[statTopicKey] = {};
								}
								angular.forEach(statTopicVal, function(val, key){
									if(!tableObj[statTopicKey][key]){
										tableObj[statTopicKey][key] = {};
									}
									tableObj[statTopicKey][key][player.characterInfo.displayName] = {
										displayValue: val.displayValue,
										value: val.value
									};
									tableObj[statTopicKey][key].displayName = ctrl.m.camelCaseToString(key);
								});
							}
						});
					});

					angular.forEach(scope.activityMembers, function(val, key){
						angular.forEach(tableObj, function(statObj){
							angular.forEach(statObj, function(stat){
								if (!stat.hasOwnProperty(key)){
									stat[key] = {
										displayValue: null,
										value: null
									};
								}
							});
						});
					});

					return calculateRatingValues(tableObj);
				};
			
				function calculateRatingValues(modelObj){
					angular.forEach(modelObj, function(statObj){
						angular.forEach(statObj, function(stat){
							stat.ratingValues = {};
							var highestVal = 0;
							var lowestVal = null;
							var statArray = [];

							angular.forEach(stat, function(playerValue, playerKey){
								var floatDisplayVal = parseFloat(playerValue.value);
								highestVal = floatDisplayVal > highestVal ? floatDisplayVal : highestVal;
								lowestVal = (floatDisplayVal < lowestVal || !lowestVal) ? floatDisplayVal : lowestVal;

								if(floatDisplayVal){
									statArray.push(floatDisplayVal);
								}
							});	

							stat.ratingValues.highestVal = isNaN(highestVal) ? 0 : highestVal;
							stat.ratingValues.lowestVal = isNaN(lowestVal) ? 0 : lowestVal;
							stat.ratingValues.avgVal = getAvg(statArray);

						});
					});

					return calculatePlayerRatings(modelObj);
				}

				function calculatePlayerRatings(ratingObj){

					angular.forEach(ratingObj, function(statCat){
						angular.forEach(statCat, function(stat){
							var leastDifferential = null;
							var avgPlayer;
							angular.forEach(stat, function(playerVal, playerKey){
								var floatDisplayVal = parseFloat(stat[playerKey].value);
								var avgDifferential = Math.abs(stat.ratingValues.avgVal - floatDisplayVal);

								if(!isNaN(stat[playerKey].displayValue)){
									leastDifferential = (avgDifferential < leastDifferential || !leastDifferential) ? avgDifferential : leastDifferential;

									if (floatDisplayVal === stat.ratingValues.highestVal && stat.ratingValues.highestVal !== stat.ratingValues.avgVal){
									 	playerVal.isGreatest = true;
									}

									if (floatDisplayVal === stat.ratingValues.lowestVal && stat.ratingValues.lowestVal !== stat.ratingValues.avgVal){
									 	playerVal.isLeast = true;
									}
						
									if (avgDifferential === leastDifferential && stat.ratingValues.avgVal !== 0){
										avgPlayer = playerKey;
									}
								}	
							});

							if(avgPlayer){
								stat[avgPlayer].isMostAvg = true;
							}

							stat.ratingValues.highestVal = stat.ratingValues.highestVal.toFixed(2);
							stat.ratingValues.lowestVal = stat.ratingValues.lowestVal.toFixed(2);
							stat.ratingValues.avgVal = stat.ratingValues.avgVal.toFixed(2);
						});
					});

					scope.isLoadingCarnageReport = false;
					return ratingObj;
				}
			}
		};

		function getAvg(array){
			var avg = 0;
			var sum = 0;

			angular.forEach(array, function(item){
				sum += item;
			});

			avg = sum / array.length;

			return isNaN(avg) ? 0 : Math.round(avg * 100) / 100;
		}
};

activityInfoCtrl.$inject = ['$scope', '$location','$anchorScroll'];

function activityInfoCtrl($scope, $location, $anchorScroll){
	var self = this;
	self.m = $scope;
	self.m.isRankLoaded = false;
	self.m.isSticky = false;
	self.m.isShowUnusedRankings = false;
	self.m.isRankNeedsUpdate = true;

	self.m.tableSelectionObject = {
			selectedCell: {},
			selectedRow: null,
			selectedColumn: null
	}
	self.m.rankingCategories = {};
	self.m.suggestedRankingCategories = {
			kills: {
				displayName: 'Kills',
				weight: 9,
				isUse: true,
				isNew: true
			},
			assists: {
				displayName: 'Assists',
				weight: 8,
				isUse: true,
				isNew: true
			},
			precisionKills: {
				displayName: 'Precision Kills',
				weight: 10,
				isUse: true,
				isNew: true
			},
			averageLifespan: {
				displayName: 'Average Lifespan',
				weight: 7,
				isUse: true,
				isNew: true
			},
			suicides: {
				displayName: 'Suicides',
				weight: -1,
				isUse: true,
				isNew: true
			},
			deaths: {
				displayName: 'Deaths',
				weight: -8,
				isUse: true,
				isNew: true
			},
			longestKillSpree: {
				displayName: 'Longest Kill Spree',
				weight: 10,
				isUse: true,
				isNew: true
			},
			resurrectionsPerformed: {
				displayName: 'Resurrections Performed',
				weight: 3,
				isUse: true,
				isNew: true
			},
			longestSingleLife: {
				displayName: 'Longest Single Life',
				weight: 5,
				isUse: true,
				isNew: true
			}
	};
	self.m.isTableCellSelected = false;
	self.m.isTableRowSelected = false;
	self.m.isTableColumnSelected = false;
	self.m.setupValueArray = setupValueArray();
	self.m.calculatePlayerStandings = calculatePlayerStandings;
	self.m.camelCaseToString = camelCaseToString;
	self.m.addNewItem = addNewItem;
	self.m.unMarKNewItem = unMarKNewItem;
	self.m.selectCell = selectCell;
	self.m.changedRankValue = changedRankValue;
	self.m.removeRankValue = removeRankValue;
	self.m.statsToExcludeArray = ['totalstats'];
	self.m.activeRankValueArray = [];

	$scope.isShowNonSearchedPlayers = true;
	$scope.clearTableSelection = clearTableSelection;
	$scope.scrollToTable = scrollToTable;

	$scope.$watch('chartModel', function(newVal){
		if(newVal.trueStats){
			activate();
		}
	});

	function activate(){
		getPossibleRankingOptions();
	}

	function setupValueArray(){
		var array = [];
		for (var i = -10; i <= 10; i++){
			array.push(i);
		}

		return array;
	}

	function getPossibleRankingOptions(){

		self.m.rankingCategories = {};
		angular.forEach(self.m.chartModel.trueStats, function(val, key){
			if(self.m.statsToExcludeArray.indexOf(key.toLowerCase()) === -1){
				var weight = self.m.suggestedRankingCategories[key] ? self.m.suggestedRankingCategories[key].weight : 0;
				self.m.rankingCategories[key] = {
					displayName: val.displayName,
					weight: weight,
					isUse: weight === 0 ? false : true,
					isNew: true
				}
			}
		});
	}

	function calculatePlayerStandings(){
		self.m.activeRankValueArray = [];
		const perfectRank = 5000;
		var highestScore = 0;
		var lowestScore = 0;

		angular.forEach(self.m.activityMembers, function(playerVal, playerKey){
			playerVal.rank = {
				totalScore: 0,
				trueRank: null,
			};

			angular.forEach(self.m.rankingCategories, function(rankVal, rankKey){
			 	var weight = rankVal.weight;

			 	if(weight === 0){
			 		removeRankValue(rankVal);
			 	}

			 	if(rankVal.isUse){
				 	var avgValue = self.m.chartModel.trueStats[rankKey].ratingValues.avgVal;
				 	var playerStatValue = self.m.chartModel.trueStats[rankKey][playerKey].value;
				 	var differential = playerStatValue - avgValue;			
				 	var statRankScore = differential * weight;

				 	self.m.chartModel.trueStats[rankKey].weight = weight;	
				 	playerVal.rank[rankKey] = statRankScore;		
			 		playerVal.rank.totalScore += statRankScore;

				 	unMarKNewItem(rankVal);
				 	self.m.activeRankValueArray.push(rankVal.displayName);
		 		}
			});

		 	highestScore = (playerVal.rank.totalScore > highestScore) ? playerVal.rank.totalScore : highestScore;
			lowestScore = (playerVal.rank.totalScore < lowestScore) ? playerVal.rank.totalScore : lowestScore;

		 	var maxActivityDuration = self.m.chartModel.trueStats.secondsPlayed.ratingValues.highestVal;
		 	var thisPlayerActivityDuration = self.m.chartModel.trueStats.secondsPlayed[playerKey].value;
		 	var timePlayedPercentage = thisPlayerActivityDuration / maxActivityDuration;
		 	var finalRankScore = (timePlayedPercentage * playerVal.rank.totalScore) / 100;

		 	playerVal.rank.timePlayedPercentage = timePlayedPercentage;
		 	//playerVal.rank.totalScore = Math.round(finalRankScore * 100) / 100;
		});		

		//Scale the new rank
		var absLowest = Math.abs(lowestScore);
		var scaledHighestScore = highestScore + absLowest;

		angular.forEach(self.m.activityMembers, function(playerVal, playerKey){
			var scaledPercent = (playerVal.rank.totalScore + absLowest) / scaledHighestScore;
		 	playerVal.rank.trueRank = Math.round(scaledPercent * perfectRank);
		});

		self.m.isRankLoaded = true;
		self.m.isRankNeedsUpdate = false;
		$scope.isShowRankings = false;
		scrollToTable();
	}

	function selectCell(columnIndex, rowIndex, cellValue){
		if((columnIndex && rowIndex && !cellValue) || checkTableSelectionObject(columnIndex, rowIndex)){
			clearTableSelection();
			return;
		}

		self.m.tableSelectionObject.selectedCell = {
			row: rowIndex,
			column: columnIndex
		};

		self.m.isTableCellSelected = columnIndex !== null && rowIndex !== null;
		self.m.isTableColumnSelected = columnIndex !== null && rowIndex == null;
		self.m.isTableRowSelected = columnIndex === null && rowIndex !== null;
	}

	function checkTableSelectionObject(columnIndex, rowIndex){
		var tempObj = {
			row: rowIndex,
			column: columnIndex
		}

		return angular.equals(tempObj, self.m.tableSelectionObject.selectedCell);
	}

	function camelCaseToString(val){
		var newString = val.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ 
			return str.toUpperCase(); 
		});

		return newString;
	}

	function unMarKNewItem(rank){
		rank.isNew = false;
	}

	function changedRankValue(rank){
		rank.isNew = true;
		self.m.isRankNeedsUpdate = true;
	}

	function addNewItem(rank){
		rank.isNew = false;
		rank.isUse = true;
		rank.isNew = true;
		self.m.isRankLoaded = false;
	}

	function clearTableSelection(){
		self.m.tableSelectionObject.selectedCell = {
			row: null,
			column: null
		};
		self.m.isTableRowSelected = false;
		self.m.isTableColumnSelected = false;
		self.m.isTableCellSelected = false;
	}

	function scrollToTable(){
		$location.hash('stats-table-container');
		$anchorScroll();
	};

	function removeRankValue(rank){
		rank.weight = 0;
		rank.isUse = false;
		rank.isNew = false;
		self.m.isRankNeedsUpdate = true;
	}
}

