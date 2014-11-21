routes.define(function($routeProvider) {
    $routeProvider.when('/timeline/:timelineId', {
        action : 'goToTimeline'
    }).when('/timeline/:timelineId/:eventId', {
        action : 'goToEvent'
    }).otherwise({
        action : 'mainPage'
    });
});

function TimelineGeneratorController($scope, template, model, date, route) {
    $scope.notFound = false;
	$scope.template = template;
    $scope.timelines = model.timelines;
    $scope.display = {};
    $scope.me = model.me;
    $scope.date = date;

    $scope.editedEvent = new Event();

    // Definition of actions
    route({
        goToTimeline : function(params) {
            template.open('timelines', 'timelines');
            model.timelines.one('sync', function() {
                $scope.timeline = undefined;
                $scope.timeline = model.timelines.find(function(timeline) {
                    return timeline._id === params.timelineId;
                });
                if ($scope.timeline === undefined) {
                    $scope.notFound = true;
                    template.open('error', '404');
                } else {
                    $scope.notFound = false;
                    $scope.timeline($scope.timeline);
                }
            });
            model.timelines.sync();
        },
        goToEvent : function(params) {
        },
        mainPage : function(params) {
        	template.open('timelines', 'timelines');
        }
    });

    $scope.openMainPage = function(){
		delete $scope.timeline;
		template.close('main');
	};

    $scope.openTimeline = function(timeline){
        $scope.timeline = timeline;
        $scope.events = timeline.events;
        timeline.open(function(){
            template.open('main', 'events');
        });
    };

    $scope.newTimeline = function(){
		$scope.timeline = new Timeline();
		template.open('main', 'edit-timeline');
	};

    $scope.newEvent = function(){
        $scope.event = new Event();
        template.open('main', 'new-event');
    };

    $scope.addEvent = function(){
        if ($scope.isTitleEmpty($scope.event.title)) {
            $scope.event.title = undefined;
            $scope.event.error = 'timelinegenerator.event.missing.title';
            return; 
        }

        if ($scope.isTextEmpty($scope.editedEvent.content)) {
            $scope.event.error = 'timelinegenerator.event.missing.content';
            return;
        }

        $scope.event.error = undefined;

        $scope.timeline.addEvent($scope.event, function(){
            $scope.event.content = ($scope.editedEvent.content);
        });
        template.open('main', 'read-event');
    };

	$scope.saveTimelineEdit = function(){
		if ($scope.timeline._id) { // when editing a timeline
			$scope.timeline.save(function(){
				$scope.timelines.sync(function(){
					$scope.cancelTimelineEdit();
					$scope.$apply();
				});
			});
		}
		else { // when creating a timeline
		    $scope.timeline.save(function(){
				template.open('main', 'share-timeline');
			});
			$scope.timelines.sync();
		}
		template.close('main');
	};

	$scope.cancelTimelineEdit = function(){
		$scope.timeline = undefined;
		template.close('main');
	};

    $scope.editTimeline = function(timeline, event){
        $scope.timeline = timeline;
        event.stopPropagation();
        template.open('main', 'edit-timeline');
    };


    $scope.shareTimeline = function(timeline, event){
        $scope.timeline = timeline;
        $scope.display.showPanel = true;
        event.stopPropagation();
    };

    $scope.confirmRemoveTimeline = function(timeline, event){
        $scope.timelines.deselectAll();
        timeline.selected = true;
        $scope.display.confirmDeleteTimelines = true;
        event.stopPropagation();
    };


    $scope.removeSelectedTimelines = function() {
        $scope.timelines.removeSelection(function(){
            $scope.display.confirmDeleteTimelines = undefined;
        });
    };

    $scope.cancelRemoveTimelines = function() {
        $scope.display.confirmDeleteTimelines = undefined;
    };

    $scope.isTitleEmpty = function(str) {
        if (str !== undefined && str.replace(/ |&nbsp;/g, '') !== "") {
            return false;
        }
        return true;
    }

    $scope.isTextEmpty = function(str) {
        if (str !== undefined && str.replace(/<div class="ng-scope">|<\/div>|<br>|<p>|<\/p>|&nbsp;| /g, '') !== "") {
            return false;
        }
        return true;
    }
}
