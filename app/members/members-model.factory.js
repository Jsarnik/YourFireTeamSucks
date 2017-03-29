angular.module('fireTeam.members')
	.factory('MembersModelFactory', ['$q','MembersOptionsService', function ($q, membersOptionsService) {
    'use strict';

    var currentDeferred;
    var charactersModel;
    var charactersPromises;

	var membersModelObject = {
		getMembersCharacterInfo: function(memberObject) {
			return $q.when(charactersModel || getMembersCharacterInfo(memberObject));
		},
		getCharacterItems: function(itemArray){
			return getCharacterItems(itemArray);
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
			
			if(response.ErrorCode && response.ErrorCode > 1){
				deferred.resolve(response);
				return deferred.promise;
			}

			deferred.resolve(response.Response);
			
		});
		return deferred.promise;
	};	

	function getCharacterItems(itemArray){
		var deferred = currentDeferred = $q.defer();
		membersOptionsService.getItemDefinitions({hashArray: itemArray}).then(function(response){
			deferred.resolve(response);
		});
		return deferred.promise;
	}

	function buildCharacterDetailsModel(data){
		
	}

	function buildMembersItemModel(){
		var model = {
			equiped:{
				weapons: {
					primary: {},
					secondary:{},
					heavy: {}
				},
				armor: {
					head: {},
					arms: {},
					chest:{},
					legs: {},
					classItem: {}
				}
				general: {
					ghost:{},
					artifact: {}
				},
				etc:{}
			}
			vault: {
				weapons: {
					primary: {},
					secondary:{},
					heavy: {}
				},
				armor: {
					head: {},
					arms: {},
					chest:{},
					legs: {},
					classItem: {}
				}
				general: {
					ghost:{},
					artifact: {}
				},
				etc:{}
			}
			
		}
	}

	return membersModelObject;
}]);