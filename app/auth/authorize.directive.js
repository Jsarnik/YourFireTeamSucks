angular
	.module('fireTeam.auth')
	.controller('authCallbackCtrl', authCallbackCtrl)
	.directive('authCallback', authCallback);

	authCallback.$inject = [];

	function authCallback() {
		return {
			restrict: 'E',
			scope: {},
			template: '<div>AUTH</div>',
			controller: authCallbackCtrl,
			controllerAs: 'ctrl',
			replace: true
		}
	};

authCallbackCtrl.$inject = ['$rootScope', '$scope', '$state', '$cookies', 'PlayerOptionsService', '$location'];

function authCallbackCtrl($rootScope, $scope, $state, $cookies, playerOptionsService, $location){
	var self = this;
	self.m = $scope.m = {
		fromState: null
	};

	$scope.$on("AuthorizationPageCalled", function (event, args) {
		self.m.fromState = args.fromState;
	});

	activate();

	function activate(){
		var code = $location.absUrl().split('?')[1].split('#')[0].split('=')[1];
		self.m.fromState = self.m.fromState || 'home';
		var body = {"code": code};

		playerOptionsService.getAccessTokenFromCode({body: body}).then(function(response){
			console.log(response);

			var args ={
				redirectTo: 'members',
				params: {
					platform: 'ps4'
				}
			}

			$scope.$emit('AuthorizedRedirectInNewWindow', args);
			//$window.close();
			// var setCookie = response['set-cookie'] || response.headers['set-cookie'] || null;
			// if(setCookie){
			// 	$cookies.put('set-cookie', JSON.stringify(setCookie));
			// }
			$location.search('code', null)
			$state.go('members', args.params);
		});
	}
}

