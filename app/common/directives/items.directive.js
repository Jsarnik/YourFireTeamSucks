angular
	.module('fireTeam.common')
	.directive('itemsDirective', itemsDirective)
	.controller('itemsDirectiveCtrl', itemsDirectiveCtrl);

	itemsDirective.$inject = ['$rootScope', '$timeout','$parse'];

	function itemsDirective($rootScope, $timeout,$parse) {
		return {
			restrict: 'E',
			scope: {
				itemModel: '=',
			},
			controller: itemsDirectiveCtrl,
			replace: true,
			template: '<div class="item-container" ng-click="toggleDetails()">' + 
						'<img ng-src="{{bungieRoot}}{{itemModel.icon}}"/>' + 
						'<div class="item-details-container" ng-show="isShowDetails">' +
							'<div>item details go here</div>' + 
						'</div>' + 
					'</div>',
			link: function(scope, element, attrs){
				var $element = angular.element(element);
				scope.bungieRoot = $rootScope.const.bungieRoot;
				scope.isShowDetails = false;

				scope.$watch('itemModel', function(newVal){
					console.log(newVal);
				});

				scope.toggleDetails = function(){
					scope.isShowDetails = !scope.isShowDetails;
					console.log(scope.isShowDetails);
				}
			}		
		}
	};

	itemsDirectiveCtrl.inject = ['$scope'];

	function itemsDirectiveCtrl($scope){
		
	}