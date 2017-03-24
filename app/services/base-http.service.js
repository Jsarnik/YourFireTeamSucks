angular.module('fireTeam.common')
		.factory('BaseHttpService', baseHttpService);

	baseHttpService.$inject = ['$http', '$q'];

	function baseHttpService($http, $q) {
		return {
			get: get,
			post: post
		};

		function get(path, model) {
			var config = {};

			if (model) {
				config.params = model;
			}

			return $http.get(path, config)
				.then(function(response) {
					return $q(function(resolve, reject) {
						resolve(handleSuccess(response));
					});
				})
				.catch(function(response) {
					return $q(function(resolve, reject) {
						resolve(handleError(response));
					});
				});
		}

		function post(path, model) {
			var config = {};

			if (model) {
				config.params = model;
			}

			return $http.post(path, config)
				.then(function(response) {
					return $q(function(resolve, reject) {
						resolve(handleSuccess(response));
					});
				})
				.catch(function(response) {
					return $q(function(resolve, reject) {
						resolve(handleError(response));
					});
				});
		}

		function handleSuccess(response) {	
			return response.data;			
		}

		function handleError(response) {
			return response.data;	
		}
	};