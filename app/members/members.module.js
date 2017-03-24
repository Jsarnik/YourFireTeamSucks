angular.module('fireTeam.members', [
	  'fireTeam.common',
    'ui.router'
])
.config(['$stateProvider', function ($stateProvider) {
	    'use strict';

      $stateProvider
              .state('members', {
                url: '/members/:platform?members',
                template: '<fireteam-members>',
                contextualCssClass:'members',
                authenticate: true
            });
	}]);