angular.module('fireTeam.common')
	.service('SearchCriteriaService', ['$cookies', function ($cookies) {

    'use strict';

    var searchCriteriaModel = null;

	return {
		setSearchCriteria: function(searchCriteriaObject) {
			searchCriteriaModel = searchCriteriaObject;
			$cookies.put('searchCriteria', JSON.stringify(searchCriteriaObject));
		},
		getSearchCriteria: function(){
			if (!searchCriteriaModel){
				searchCriteriaModel = angular.fromJson($cookies.get('searchCriteria')) || searchCriteriaModel;
			}
			return searchCriteriaModel;
		},
		clearSearchCriteria: function(){
			searchCriteriaModel = null;
		}
	}

}]);