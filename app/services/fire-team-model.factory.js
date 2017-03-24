angular.module('fireTeam.common')
	.factory('FireTeamModelFactory', ['$q','PlayerOptionsService', function ($q, playerOptionsService) {
    'use strict';

	var fireTeamModel, playerPromises;

	var fireTeamModelObject = {
		getFireTeam: function(platformString, userNames) {
			return $q.when(fireTeamModel || playerPromises || getFireTeamMembers(platformString, userNames));
		},
		getCharacterInfo: function(member, characters) {
			return getCharacterData(member, character);
		},
		clear: clear
	};	

	function clear() {
			fireTeamModel = null;
			playerPromises = null;
		}

	function getFireTeamMembers(platformString, userNames) {
		var deferred = $q.defer();
		var playerPromises = [];
		var memberType = platformString == 'ps4' ? 2 : 1; 

		angular.forEach(userNames, function(user){
			playerPromises.push(getPlayerData(memberType, user));
		});

		return fireTeamModel = $q.all(playerPromises);
	};

    function getPlayerData(memberType, userName) {
		var deferred = $q.defer();
		playerOptionsService.getMembershipId({memberType: memberType, userName: userName}).then(function (response) {	
			var membershipModel = response;

			if (!membershipModel){
				var customErrorResponse = {
					ErrorCode: 101,
					Error: "An unspecified system error occured! Could not find player: " + userName
				};
				deferred.resolve(customErrorResponse);
				return deferred.promise;
			}

			playerOptionsService.getBaseCharacterInfo({membershipId: response.membershipId}).then(function (response) {
				if(response.ErrorCode > 1){
					deferred.resolve(response);
					return deferred.promise;
				}

				response = response.Response.data
				response.membershipInfo = membershipModel;

				angular.forEach(response.characters, function(character){
					switch(character.characterBase.classType){
						case 0:
							character.className = 'Titan';
							break;
						case 1:
							character.className = 'Hunter';
							break;
						case 2:
							character.className = 'Warlock';
							break;
						default:
							character.className = 'Unknown';
					}
				});
				deferred.resolve(response);
			});
		}, function (error){
			deferred.resolve(error);
			return deferred.promise;
		});
		return deferred.promise;
	};

	function getCharacterData(member, characters){
		playerOptionsService.getBaseCharacterInfo({membershipId: membershipId}).then(function (response) {	
			return response.Response.data;
		});
	};

	function getBaseCharacterInfo(membershipId){
		playerOptionsService.getBaseCharacterInfo({membershipId: membershipId}).then(function (response) {	
			return response.Response.data;
		});
	};		

	return fireTeamModelObject;
}]);