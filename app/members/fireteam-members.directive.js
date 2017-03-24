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
		fireTeamMembers : {}
	}

	activate();

	function activate(){

		var membersArray = $state.params.members ? $state.params.members.split(';') : [];

		var membersObject = {
			platform: 2,
			membershipId: '4611686018446331620',
			characters: ['2305843009273807564']
		}

		membersModelFactory.getMembersCharacterInfo(membersObject).then(function(response){
			self.m.fireTeamMembers = response;
			return response;
		}).then(function(characters){
			console.log(characters)
		});
	}
}

