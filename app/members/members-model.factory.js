angular.module('fireTeam.members')
	.factory('MembersModelFactory', ['$q','MembersOptionsService', function ($q, membersOptionsService) {
    'use strict';

    var currentDeferred;
    var charactersModel;
    var charactersPromises;

	var membersModelObject = {
		getMembersCharacterInfo: function(memberObject) {
			debugger;
			return $q.when(charactersModel || getMembersCharacterInfo(memberObject));
			//return getMembersCharacterInfo(memberObject);
		},
		cancelAllPromises: function(){
			progress = 0;
			if(currentDeferred){
				currentDeferred.resolve({Message: 'user cancelled'});
			}
			else{
				currentDeferred = $q.defer();
				currentDeferred.resolve({Message: 'nothing to resolve'});
			}

			return currentDeferred.promise;
		},
		clear: clearCharactersModel
	};

	function clearCharactersModel() {
		charactersModel = null;
	}

	function getMembersCharacterInfo(memberObject) {
		charactersPromises = [];

		angular.forEach(memberObject.characters, function(characterId){
			charactersPromises.push(getCharacterData(memberObject, characterId));
		});

	 	return charactersModel = $q.all(charactersPromises);
	};

    function getCharacterData(memberObject, characterId) {
		var deferred = currentDeferred = $q.defer();



		membersOptionsService.getCompleteCharacterInfo({membershipType: memberObject.platform, membershipId: memberObject.membershipId, characterId: characterId}).then(function (response) {	
			
			console.log(response);
			if(response.ErrorCode && response.ErrorCode > 1){
				deferred.resolve(response);
				return deferred.promise;
			}
			
			// var characterModel = {
			// 	definitions: buildCharacterDetailsModel(response.Response.definitions)
			// }
			// deferred.resolve(characterModel);
			
		});
		return deferred.promise;
	};	

	function buildCharacterDetailsModel(data){
		
	}

	return membersModelObject;
}]);