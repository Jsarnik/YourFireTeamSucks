angular
	.module('fireTeam.members')
	.controller('fireteamMembersCtrl', fireteamMembersCtrl)
	.directive('fireteamMembers', fireteamMembers);

	fireteamMembers.$inject = [];

	function fireteamMembers() {
		return {
			restrict: 'E',
			scope: {},
			templateUrl: 'members/members.html',
			controller: fireteamMembersCtrl,
			controllerAs: 'ctrl',
			replace: true
		}
	};

fireteamMembersCtrl.$inject = ['$rootScope', '$scope', '$state', 'MembersModelFactory'];

function fireteamMembersCtrl($rootScope, $scope, $state, membersModelFactory){
	var self = this;
	self.m = $scope.m = {
		platform: $state.params.platform,
		fireTeamMembers : null
	}

	$scope.queryTest = queryTest;
	$scope.getChar = getChar;

	activate();

	function activate(){

		var membersArray = $state.params.members ? $state.params.members.split(';') : [];

		var membersObject = {
			platform: 2,
			membershipId: '4611686018446331620',
			characters: ['2305843009273807564']
		}

		membersModelFactory.getMembersCharacterInfo(membersObject).then(function(response){
			self.m.fireTeamMembers = response[0].data;
			return response[0].data;
		}).then(function(characters){
			console.log(characters);
		});
	}

	function getChar(){
		var membersObject = {
			platform: 2,
			membershipId: '4611686018446331620',
			characters: ['2305843009273807564']
		}

		membersModelFactory.getMembersCharacterInfo(membersObject).then(function(response){
			self.m.fireTeamMembers = response[0].data;
			console.log(self.m.fireTeamMembers);
			//return response.Response.data;
		});
	}

	function queryTest(){
		debugger;
		var items = self.m.fireTeamMembers.characterBase.peerView.equipment;
		var hashArray = [];

		angular.forEach(items, function(item){
			hashArray.push(item.itemHash);
		});

		membersModelFactory.getCharacterItems(hashArray).then(function(response){
			self.m.fireTeamMembers.items = response;
			console.log(response);
		});
	}
}

