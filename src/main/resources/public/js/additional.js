module.directive('timeline', function($compile){
	return {
		restrict: 'E',
		replace: true,
		template: '<div class="timeline-js" id="my-timeline"></div>',
		link: function($scope, $element, $attributes) {
			createStoryJS({
                type:       'timeline',
                width:      '800',
                height:     '600',
                source:     $scope.toTimelineJsJSON(),
                embed_id:   'my-timeline',
                lang: 'fr',
                css: '/timelinegenerator/public/css/timeline/timeline.css',
                js: '/timelinegenerator/public/js/timeline-min.js'
            });
		}
	}
});
