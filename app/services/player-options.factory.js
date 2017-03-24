angular.module('fireTeam.common')
	.factory('PlayerOptionsService', ['BaseHttpService', function (baseHttpService) {
    'use strict';

    return {
        getAccessTokenFromCode: baseHttpService.post.bind(this, '../api/getAccessTokenFromCode'),
        getMembershipId: baseHttpService.get.bind(this, '../api/getMembershipIdByUserName'),
        getBaseCharacterInfo: baseHttpService.get.bind(this, '../api/getCharacterInfoByMembershipId'),
        getCharacterStatsData: baseHttpService.get.bind(this, '../api/getCharacterStatsById'),
        getCharacterActivityHistoryData: baseHttpService.get.bind(this, '../api/getCharacterActivityHistoryData'),
        getPlayerActivityHistoryData: baseHttpService.get.bind(this, '../api/getPlayerActivityHistoryData'),
        getPostGameCarnageReport: baseHttpService.get.bind(this, '../api/getPostGameCarnageReport'),
        getWeaponDefinitionById: baseHttpService.get.bind(this, '../api/getWeaponDefinitionById'),
    };
}]);