angular
	.module('fireTeam.activity')
	.controller('activityMatchCtrl', activityMatchCtrl)
	.directive('activityMatch', activityMatch);

	activityList.$inject = ['$rootScope', '$timeout', '$window'];

	function activityMatch($rootScope, $timeout, $window) {
		return {
			restrict: 'E',
			scope: {
				isNewSearch: '='
			},
			templateUrl: '/activities/activity-match.html',
			controller: activityMatchCtrl,
			controllerAs: 'ctrl',
			transclude: true,
			replace: true
		};
};

activityMatchCtrl.$inject = ['$scope', '$location','$anchorScroll', 'FireTeamModelFactory', 'ActivityModelFactory', 'SearchCriteriaService'];

function activityMatchCtrl($scope, $location, $anchorScroll,fireTeamModelFactory, activityModelFactory, $timeout, $cookies, searchCriteriaService){
	var self = this;
	self.m = $scope;
	self.m.fireTeamMembers = {};
	self.m.fireTeamActivityResults = [];
	self.m.searchCriteria = searchCriteriaService.getSearchCriteria();
	self.m.isLoadingData = false;
	self.m.matchAttempts = 0;
	self.m.maxMatchAttempts = 10;

	activate();

	function activate(){
		getFireTeamModel();
	};

	function getFireTeamModel(){
			if(self.m.isLoadingData){
				return;
			}

			if(!$scope.isNewSearch){
				return;
			}

			self.m.isLoadingData = true;
			self.m.isShowActivityList = true;
			self.m.errorMessage = null;

			self.m.fireTeamActivityResults = [];

			fireTeamModelFactory.getFireTeam(self.m.searchCriteria.platform, self.m.searchCriteria.members).then(function(response){
				var playerResponseError = false;
				angular.forEach(response, function(playerResponse){
					if((playerResponse.status && playerResponse.status !== 200) || (playerResponse.data && playerResponse.data.ErrorCode)){
						playerResponseError = true;
						throwError(playerResponse.data);
					}
				});

				if(playerResponseError){
					return;
				}

				self.m.fireTeamMembers = response;
				self.m.fireTeamMembers.gameMode = m.selectedGameMode.value;
				self.m.fireTeamMembers.pageNum = 0;

				setSearchCriteria();
				$scope.isNewSearch = false;

				activityModelFactory.getPlayerInstanceList(m.fireTeamMembers).then(function(response){
					if(response.length > 0){
						getFireTeamInstanceData(compareInstances(response));
					}
					else{
						throwError({ErrorCode: 100, Error: 'No matching results found.'});
					}
				});
			}, function(error){
				throwError(error);
			});
		};

	function getMoreResults(){
			if(self.m.isLoadingData){
				return;
			}

			self.m.isLoadingData = true;
			self.m.fireTeamMembers.pageNum += 1;
			activityModelFactory.getPlayerInstanceList(m.fireTeamMembers).then(function(response){
				if(response.length > 0){
					getFireTeamInstanceData(compareInstances(response));
				}
				else{
					throwError({Error: 'No matching results found.'});
				}
			});
		}

		function getFireTeamInstanceData(instanceIdArray){
			if (instanceIdArray.length < 1){
				self.m.matchAttempts += 1;
				self.m.isLoadingData = false;

				if(self.m.matchAttempts <= self.m.maxMatchAttempts){
					getMoreResults();
				}
				return;
			}

			m.activityListProgress = {
					totalActivities: 0,
					activitiesLoaded: 0,
					percentComplete: 0
				}

			var originalArrayLength = instanceIdArray.length;

			getActiviesPagination(instanceIdArray, self.m.activityLookupPerSearch);

			startPollingForProgress(100, originalArrayLength);
		}

		function getActiviesPagination(array, amountToProcess){
			if(array.length < amountToProcess){
				amountToProcess = array.length;
			}

			var arrayToProcess = array.splice(0, amountToProcess);
			var remainingLength = array.length;

			activityModelFactory.getFireTeamActivities(arrayToProcess).then(function(response){
				if(response[0].ErrorCode && response[0].ErrorCode > 1){
					throwError(response[0]);
					return;
				}
				angular.forEach(response, function(activity){
					angular.forEach(activity.playerPostGameCarnageReport, function(val, key){
						activity.playerPostGameCarnageReport[key].isSearchedPlayer = isSearchedPlayer(key.toLowerCase());
					});

					if(!activity.Message){
						self.m.fireTeamActivityResults.push(activity);
					}
				});
			
				if(remainingLength > 0 && m.isLoadingData){
					self.m.activitiesDisplayed = self.m.activitiesDisplayed < self.m.fireTeamActivityResults.length ? self.m.activitiesDisplayed : self.m.fireTeamActivityResults.length;
					getActiviesPagination(array, amountToProcess);
					return;
				}

				if(!$scope.isNewSearch){
					self.m.lastSuccessSearchCriteria = m.searchCriteria;
				}

				self.m.isLoadingData = false;
				clearData();
				
			});
		}

		function isSearchedPlayer(lowerCaseNameToCheck){
			var searchedPlayersLowerCaseStringArray = [];
			angular.forEach(self.m.playersArrays, function(searchedPlayer){
				searchedPlayersLowerCaseStringArray.push(searchedPlayer.displayName.toLowerCase());
			});

			return searchedPlayersLowerCaseStringArray.indexOf(lowerCaseNameToCheck) !== -1;
		}

		function loadActivityByIdParameter(id){
			var array = [id];

			activityModelFactory.getFireTeamActivities(array).then(function(response){
				if(response[0].ErrorCode && response[0].ErrorCode > 1){
					throwError(response[0]);
					return;
				}
				var activity = response[0];
				angular.forEach(activity.playerPostGameCarnageReport, function(val, key){
					activity.playerPostGameCarnageReport[key].isSearchedPlayer = isSearchedPlayer(key.toLowerCase());
				});
				m.fireTeamActivityResults.push(activity);
				selectActivity(activity);
			})
		}

		function startPollingForProgress(delay, matches){
			if(delay < 500){
				delay += (delay * .2);
			}
			m.activityListProgress.totalActivities = matches;
			m.pollingTimeout = $timeout(function() {
				var progress = activityModelFactory.getProgress();
				m.activityListProgress = {
					totalActivities: matches,
					activitiesLoaded: progress,
					percentComplete: Math.round((progress / matches) * 100)
				}
				m.showProgressMessage = m.activityListProgress.percentComplete > 0 || m.activityListProgress.percentComplete < 100 ? true : false;
				if(m.isLoadingData){
					startPollingForProgress(delay, matches);
				}
			}, delay);
		}

		function compareInstances(charactersInstanceArrays){
			var checkArray = charactersInstanceArrays[0];
			var matchArray = [];

			for (var i = 0; i < checkArray.length; i++){
				var instanceId = checkArray[i];
				var instanceExistsInAll = true;
				for (var j = 1; j < charactersInstanceArrays.length; j++){
					instanceExistsInAll = recursiveInstanceMatch(instanceId, charactersInstanceArrays[j]);
				}
				if(instanceExistsInAll){
					matchArray.push(instanceId);
				}
			}

			return matchArray;
		}

		function recursiveInstanceMatch(val, array){
			var exists = false;

			for (var i = 0; i <= array.length; i++){
				if(array[i] === val){
					exists = true;
				}
			}
			return exists;
		}

		function selectActivity(activity){
			clearInterval(m.instanceInterval);
			$location.search('instanceId', activity.activityDetails.instanceId);
			m.selectedActivity = activity;
			m.isShowActivityList = false;
			clearInterval(m.instanceInterval);
		}

		function showMoreResults(amt){
			m.activitiesDisplayed += amt;
			if(m.activitiesDisplayed > m.fireTeamActivityResults.length){
				m.activitiesDisplayed = m.fireTeamActivityResults.length;
			}
		}
}

