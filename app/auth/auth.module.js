angular.module('fireTeam.auth', [
	  'fireTeam.common',
    'ui.router'
])
.config(['$stateProvider', function ($stateProvider) {
	    'use strict';

      $stateProvider
              .state('auth', {
                url: '/authorize',
                template: '<auth-callback></auth-callback>',
                contextualCssClass:'auth',
                authenticate: true
            });
	}]);