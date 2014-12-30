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
                    $scope.openTimeline($scope.timeline);
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

    $scope.hideAlmostAllButtons = function(timeline){
        $scope.timelines.forEach(function(tl){
            if(tl !== timeline){
                tl.showButtons = false;
            }
        });
    };

    $scope.openMainPage = function(){
		delete $scope.timeline;
        $scope.timelines.forEach(function(tl) {
            tl.showButtons = false;
        });
		template.close('main');
	};

    $scope.openTimeline = function(timeline){
        $scope.timeline = timeline;
        $scope.events = timeline.events;
        $scope.timelines.forEach(function(tl) {
            if (tl._id != timeline._id) {
                tl.showButtons = false;                
            }
        });
        $scope.timeline.open(function(){
            template.open('timelines', 'timelines');
            template.open('main', 'events');
            $scope.$apply();
        });
    };

     $scope.openTimelineViewer = function(timeline){
        $scope.timeline = timeline;
        $scope.events = timeline.events;
        Behaviours.applicationsBehaviours.timelinegenerator.sniplets.timelines.controller.source = timeline;
        timeline.open(function(){
            template.close('main');
            template.open('timelines', 'read-timeline');
        });
    };

    $scope.newTimeline = function(){
		$scope.timeline = new Timeline();
		template.open('main', 'edit-timeline');
	};

    $scope.newEvent = function(){
        $scope.event = new Event();
        $scope.event.startDate = moment();
        $scope.event.endDate = moment();
        $scope.setEventMediaType($scope.event);
        template.open('main', 'edit-event');
    };

    $scope.addEvent = function(){
        if ($scope.isTitleEmpty($scope.event.headline)) {
            $scope.event.headline = undefined;
            $scope.event.error = 'timelinegenerator.event.missing.headline';
            return; 
        }

        if ($scope.isTextEmpty($scope.event.text)) {
            $scope.event.text = undefined;
            $scope.event.error = 'timelinegenerator.event.missing.text';
            return;
        }

        $scope.event.error = undefined;
        $scope.timeline.addEvent($scope.event, function() {
            $scope.openTimeline($scope.timeline);
        });
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

    $scope.saveEventEdit = function(){
        if ($scope.event._id) { // when editing an event
            $scope.event.save(function(){
                template.close('main');
                $scope.timeline.events.sync(function(){
                    $scope.cancelEventEdit();
                });
            });
        }
        else { // when creating an event
           $scope.addEvent();
        }
    };

    $scope.cancelEventEdit = function(){
        $scope.event = undefined;
        $scope.openTimeline($scope.timeline);
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

     $scope.editEvent = function(timelineEvent, event){
        $scope.event = timelineEvent;
        $scope.setEventMediaType($scope.event);
        event.stopPropagation();
        template.open('main', 'edit-event');
    };

    $scope.setEventMediaType = function(event) {
         if (event.video) {
            event.mediatype = 'video';
        } else {
            event.mediatype = 'img';
        }
    }

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


    $scope.confirmRemoveSelectedEvents = function() {
        $scope.display.confirmDeleteEvents = true;
    };

    $scope.removeSelectedEvents = function() {
        $scope.events.removeSelection(function(){
            $scope.display.confirmDeleteEvents = undefined;
        });
    };

    $scope.cancelRemoveSubjects = function() {
        $scope.display.confirmDeleteEvents = undefined;
    };

    $scope.resetEventImage = function(event) {
        console.log('reset event image');
        event.img = '';
        console.log(event);
    }

    $scope.resetEventVideo = function(event) {
        console.log('reset event video');
        event.video = '';
    }
}
