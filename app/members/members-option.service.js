angular.module('fireTeam.members')
	.factory('MembersOptionsService', ['BaseHttpService', function (baseHttpService) {
    'use strict';

    return {
        getCompleteCharacterInfo: baseHttpService.get.bind(this, '../api/getCompleteCharacterInfo'),
    };
}]);