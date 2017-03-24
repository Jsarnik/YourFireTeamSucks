angular.module('fireTeam.common')
	.controller('mainCtrl', MainCtrl);

	MainCtrl.$inject = ['$rootScope','$scope', '$state', '$location', 'GoogleAnalyticsService', 'FireTeamModelFactory', 'ActivityModelFactory', '$timeout', '$cookies', 'SearchCriteriaService', 'PlayerOptionsService', '$window'];

	function MainCtrl($rootScope, $scope, $state, $location, googleAnalyticsService, fireTeamModelFactory, activityModelFactory, $timeout, $cookies, searchCriteriaService, playerOptionsService, $window) {

		var m = $scope.m = {
			fireTeamActivityResults: [],
			playersArrays: [{
				displayName: '',
				isPlaceHolder: true
			}],
			fireTeamMembers: {},
			maxMembers: 6,
			gameModes:{},
			selectedGameMode:{
				value: 'None',
				displayName: 'Any'
			},
			platformTypes: {
				xbox: {
					id: 1,
					displayValue: 'xbox'
				},
				ps4: {
					id: 2,
					displayValue: 'ps4'
				}
			},
			selectedPlatform: null,
			errorMessage: null
		}
		m.showDropDown = false;
		m.pollingTimeout;
		m.activityLookupPerSearch = 10;
		m.activitiesDisplayed = m.activityLookupPerSearch;
		m.hidePlaceHolder = false;
		m.isShowActivityList = false;
		m.showProgressMessage = false;
		m.showRecentSearches = false;
		m.activityListProgress = {};
		m.recentSearches = [];
		m.isNewSearch = true;
		m.selectedPlatform = m.platformTypes.ps4;
		m.pageInitialized = false;
		m.instanceInterval;
		m.searchCriteria = searchCriteriaService.getSearchCriteria();
		m.lastSuccessSearchCriteria = null;
		m.maxMatchAttempts = 10;
		m.matchAttempts = 0;
		m.hoveredActivity = null;
		m.currentStateParams = null;
		m.copyrightYear = getDate();

		$scope.selectPlatform = selectPlatform;
		$scope.selectActivity = selectActivity;
		$scope.getFireTeamModel = getFireTeamModel;
		$scope.getMoreResults = getMoreResults;
		$scope.formatDate = formatDate;
		$scope.addPlayer= addPlayer;
		$scope.keyDownEvt = keyDownEvt;
		$scope.loadRecentSearch = loadRecentSearch;
		$scope.cancelSearch = cancelSearch;
		$scope.search = search;
		$scope.selectMode = selectMode;
		$scope.showMoreResults = showMoreResults;

		$rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
			googleAnalyticsService.pageLoad($location.absUrl(), toState.name);
			m.currentStateParams = toParams;
			var membersArray = toParams.members ? toParams.members.split(';') : [];

			m.selectedPlatform = m.platformTypes[toParams.platform] || m.selectedPlatform;

			if(membersArray.length > 0){
				m.selectedPlatform = m.platformTypes[toParams.platform];
				if(toParams.mode){
					angular.forEach(m.gameModes, function(mode){
						angular.forEach(mode, function(modeItem){
							if(modeItem.value === toParams.mode){
								m.selectedGameMode = modeItem;
							}
						})
					}) 
				}

				var fireTeamMembers = [];
				angular.forEach(membersArray, function(player){
					fireTeamMembers.push({displayName: player, isPlaceHolder : false});
				});

				m.playersArrays = fireTeamMembers || m.searchCriteria.members;
				
				if(toParams.instanceId){
					loadActivityByIdParameter(toParams.instanceId);
				}
				$timeout(function(){
					getFireTeamModel();
				},10);

				var recentSearch = {
					players: m.playersArrays,
					platformType: m.selectedPlatform,
					mode: m.selectedGameMode
				}

				updateRecentSearches(recentSearch);
			}
			
		});

		$scope.signIn = function(){
			
			//$scope.m.calcWindow = $window.open('https://www.bungie.net/en/Application/Authorize/11587', '', 'width=320, height=591, location=0');
			$scope.$broadcast("AuthorizationPageCalled",{ fromState: $state.current.name });
		}

		$scope.$watch('m.playersArrays', function(newVal, oldVal){
			if(newVal.length <= 1 && newVal[0].isPlaceHolder){
				return;
			}

			if(!angular.equals(newVal,oldVal)){
				setSearchCriteria();
			}

			$timeout(function(){
				inputDetectionFn(newVal);
			},10);
			
		}, true);

		init();

		function init(){
			buildGameModeObj();
			checkRecentSearches();
			m.pageInitialized = true;
			//m.searchCriteria = searchCriteriaService.getSearchCriteria();
		}

		function setSearchCriteria(){
			var membersNameArray = [];
			angular.forEach(m.playersArrays, function(players){
				if(!players.isPlaceHolder){
					membersNameArray.push(players.displayName);
				}
			});

			m.searchCriteria = {
				members: membersNameArray,
				platform: m.selectedPlatform,
				mode: m.selectedGameMode
			};

			m.isNewSearch = !angular.equals(m.searchCriteria, m.lastSuccessSearchCriteria);

			searchCriteriaService.setSearchCriteria(m.searchCriteria);
		}

		function buildGameModeObj(){
			m.gameModes = {
					generic:[
						{
							value: 'None',
							displayName: 'Any'
						}
					],
					pve:[
						{
							value: 'AllPvE',
							displayName: 'PvE (Any)'
						},{
							value: 'Story',
							displayName: 'Story'
						},{
							value: 'Strike',
							displayName: 'Strike'
						},{
							value: 'Raid',
							displayName: 'Raid'
						},{
							value: 'Nightfall',
							displayName: 'Nightfall'
						},{
							value: 'Heroic',
							displayName: 'Heroic'
						},{
							value: 'AllStrikes',
							displayName: 'Strikes (All)'
						},{
							value: 'Arena',
							displayName: 'Arena'
						},{
							value: 'AllArena',
							displayName: 'All Arena'
						},{
							value: 'ArenaChallenge',
							displayName: 'Arena Challenge'
						},{
							value: 'None',
							displayName: 'Any'
						}
					],
					pvp: [
						{
							value: 'AllPvP',
							displayName: 'PvP (Any)'
						}
						,{
							value: 'ThreeVsThree',
							displayName: '3 v 3'
						},{
							value: 'Control',
							displayName: 'Control'
						},{
							value: 'Lockdown',
							displayName: 'Lockdown'
						},{
							value: 'Team',
							displayName: 'Team'
						},{
							value: 'FreeForAll',
							displayName: 'Free For All'
						},{
							value: 'IronBanner',
							displayName: 'Iron Banner'
						},{
							value: 'TrialsOfOsiris',
							displayName: 'Trials Of Osiris'
						},{
							value: 'Elimination',
							displayName: 'Elimination'
						},{
							value: 'Rift',
							displayName: 'Rift'
						},{
							value: 'ZoneControl',
							displayName: 'Control'
						},{
							value: 'Racing',
							displayName: 'Sparrow Racing'
						},{
							value: 'Supremacy',
							displayName: 'Supremacy'
						},{
							value: 'Mayhem',
							displayName: 'Mayhem'
						},{
							value: 'PrivateMatchesAll',
							displayName: 'Private Matches (All)'
						}
					]
				}
		}

		function selectPlatform(platform){
			m.selectedPlatform = platform;
			setSearchCriteria();
		}

		function selectMode(mode){
			m.selectedGameMode = mode;
			setSearchCriteria();
		}

		function inputDetectionFn(model){
			var firstPlaceHolderIndex = null;
			var placeHolderCount = 0;

			angular.forEach(model, function(input, index){
				if(input.isPlaceHolder){
					placeHolderCount += 1;
			  		if(!firstPlaceHolderIndex){
						firstPlaceHolderIndex = index;
					}				
				}
			});

			if(placeHolderCount < 1){
				addPlayer();
			}

			if(placeHolderCount > 1 && firstPlaceHolderIndex){
				m.playersArrays.splice(firstPlaceHolderIndex, 1);
			}
		}

		function checkRecentSearches(){
			var recentSearchCookie = $cookies.get('recentSearches');
			if(recentSearchCookie){
				m.recentSearches = angular.fromJson(recentSearchCookie);
			}
		}

		function loadRecentSearch(index){
			m.playersArrays = m.recentSearches[index].players;
			m.selectedPlatform = m.recentSearches[index].platformType || m.selectedPlatform;
			m.selectedGameMode = m.recentSearches[index].mode || m.selectedGameMode;
			$scope.$apply();
			setSearchCriteria();
		}

		function addPlayer(){
			if(m.playersArrays.length < m.maxMembers){
				m.playersArrays.push({displayName:'', isPlaceHolder: true});
			}
		}

		function search(){
			if(m.playersArrays[0].isPlaceHolder){
				throwError({ErrorCode: 101, Error: 'Please enter a player name.'});
				return;
			}
			m.selectedActivity = null;
			m.isNewSearch = true;

			var newSearchParams = {
				platform: m.selectedPlatform.displayValue,
				members: '',
				mode: m.selectedGameMode.value,
				instanceId: undefined
			}

			var membersString = '';
			angular.forEach(m.playersArrays, function(p){
				if(!p.isPlaceHolder){
					newSearchParams.members = newSearchParams.members + p.displayName + ';'
			 	}
			});

			newSearchParams.members = newSearchParams.members.replace(/;+$/, "");
			if(angular.equals(newSearchParams, m.currentStateParams)){
				$state.reload();
			}

			googleAnalyticsService.eventClick('click', 'search');
			$state.go('search', newSearchParams);
		}

		function getFireTeamModel(){
			if(m.isLoadingData){
				return;
			}

			if(!m.isNewSearch){
				return;
			}

			m.isLoadingData = true;
			m.isShowActivityList = true;
			m.errorMessage = null;

			m.fireTeamActivityResults = [];
			fireTeamModelFactory.clear();

			fireTeamModelFactory.getFireTeam(m.selectedPlatform.displayValue, m.searchCriteria.members).then(function(response){
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

				m.fireTeamMembers = response;
				m.fireTeamMembers.gameMode = m.selectedGameMode.value;
				m.fireTeamMembers.pageNum = 0;

				setSearchCriteria();
				m.isNewSearch = false;

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

		function cancelSearch(){
			activityModelFactory.cancelAllPromises().then(function(response){
				m.fireTeamActivityResults = [];
				m.isNewSearch = true;
				m.isLoadingData = false;
				m.lastSuccessSearchCriteria = null;
				clearData();	
			});
		}

		function throwError(data){
			if(!data.Error && !data.Error){
				data.ErrorCode = 100;
			}

			//Custom Error Handling
			switch (data.ErrorCode){
				case 100:
					data.Error = 'A system error occurred. Please try again';
					break;		
				case 401:	
					data.Error = 'Failed to reach Destiny Servers. Please try again in a few minutes.';
					break;		
				case 500:	
					data.Error = 'A critical error occured. Please try again.';
					break;	
			}

			m.errorMessage = data.Error;
			m.isLoadingData = false;	
			m.isNewSearch = true;
			clearData();
		}

		function getMoreResults(){
			if(m.isLoadingData){
				return;
			}

			m.isLoadingData = true;
			m.fireTeamMembers.pageNum += 1;
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
				m.matchAttempts += 1;
				m.isLoadingData = false;

				if(m.matchAttempts <= m.maxMatchAttempts){
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

			getActiviesPagination(instanceIdArray, m.activityLookupPerSearch);

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
						m.fireTeamActivityResults.push(activity);
					}
				});
			
				if(remainingLength > 0 && m.isLoadingData){
					m.activitiesDisplayed = m.activitiesDisplayed < m.fireTeamActivityResults.length ? m.activitiesDisplayed : m.fireTeamActivityResults.length;
					getActiviesPagination(array, amountToProcess);
					return;
				}

				if(!m.isNewSearch){
					m.lastSuccessSearchCriteria = m.searchCriteria;
				}

				m.isLoadingData = false;
				clearData();
				
			});
		}

		function isSearchedPlayer(lowerCaseNameToCheck){
			var searchedPlayersLowerCaseStringArray = [];
			angular.forEach(m.playersArrays, function(searchedPlayer){
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

		function formatDate(inputDate){
			var outputDate = new Date(inputDate);
			return outputDate;
		}

		function keyDownEvt(e){
			switch(e.keyCode){
				case 13:
					e.preventDefault();
					search();
				break;
			}
		}

		function updateRecentSearches(obj){
			var recentMatch = false;
			angular.forEach(m.recentSearches, function(item){
				if(angular.equals(item, obj)){
					recentMatch = true;
				}
			});
			
			if(recentMatch){
				return;
			}

			if(m.recentSearches.length >= 10){
				m.recentSearches.splice(0,1);
			}

			m.recentSearches.push(obj);
			setCookie('recentSearches', m.recentSearches)
		}

		function setCookie(name, val, exp){
  			$cookies.put(name, JSON.stringify(val));
		}

		function clearData(){
			if(m.pollingTimeout){
				$timeout.cancel(m.pollingTimeout);
			}

			m.activitiesDisplayed = m.fireTeamActivityResults.length < m.activityLookupPerSearch ? m.fireTeamActivityResults.length : m.activitiesDisplayed;
			m.matchAttempts = m.maxMatchAttempts;
			m.showProgressMessage = false;
			m.activityListProgress = {
					totalActivities: 0,
					activitiesLoaded: 0,
					percentComplete: 0
				}

			activityModelFactory.clearProgress();
		}

		function getDate(){
			var date = new Date();
			return date.getFullYear();
		}
	};


