routes.define(function($routeProvider) {
    $routeProvider.when('/view/:timelineId', {
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
    $scope.model = model;
    $scope.display = {};
    $scope.me = model.me;
    $scope.date = date;
    $scope.moment = moment;

    $scope.editedEvent = new Event();

    $scope.sort = {
        predicate: 'headline',
        reverse: false
    }

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
        $scope.event.dateFormat = "day";
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
        if ($scope.event.startDate.isAfter($scope.event.endDate)) {
            $scope.event.error = 'timelinegenerator.event.start.date.after.end.date';
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
        if (!$scope.event.enableEndDate) {
            $scope.event.endDate = "";
        }
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
        $scope.timelines.forEach(function(tl) {
            tl.showButtons = false;                
        });
		template.close('main');
	};

    $scope.editTimeline = function(timeline, event){
        $scope.timeline = timeline;
        event.stopPropagation();
        template.open('main', 'edit-timeline');
    };

     $scope.editEvent = function(timelineEvent, event){
        $scope.event = timelineEvent;
        $scope.event.startDate = moment($scope.event.startDate);
        var endDate = $scope.event.endDate;
        $scope.event.endDate = moment($scope.event.endDate);

        if (endDate) {

            $scope.event.enableEndDate = true;

            if ($scope.event.dateFormat == 'year') {
                $scope.event.endDate.newDate = $scope.event.endDate.years();
            } else if ($scope.event.dateFormat == 'month') {
                $scope.event.endDate.newDate = $scope.event.endDate.format('MM') + '/' + $scope.event.endDate.years();   
            } 
        }

        if ($scope.event.dateFormat == 'year') {
            $scope.event.startDate.newDate = $scope.event.startDate.years();
        } else if ($scope.event.dateFormat == 'month') {
            $scope.event.startDate.newDate = $scope.event.startDate.format('MM') + '/' + $scope.event.startDate.years();
        } 

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
        event.img = '';
    }

    $scope.resetEventVideo = function(event) {
        event.video = '';
    }

    $scope.switchDateFormat = function() {
        if ($scope.event.dateFormat == 'year') {
            $scope.event.startDate.newDate = $scope.event.startDate.years();
            $scope.event.endDate.newDate = $scope.event.endDate.years();
        } else if ($scope.event.dateFormat == 'month') {
            $scope.event.startDate.newDate = $scope.event.startDate.format('MM/YYYY');
            $scope.event.endDate.newDate = $scope.event.endDate.format('MM/YYYY');   
        }
    }

    $scope.resetEndDate = function() {
        if (!$scope.event.enableEndDate) {
            $scope.event.endDate = undefined;
        }
    }

    $scope.setDateYear = function(date) {
        if ($scope.event.dateFormat == 'month') {
            var splitted = date.newDate.split("/");
            date.month(parseInt(splitted[0]) - 1);
            date.year(splitted[1]);
        } else if ($scope.event.dateFormat == 'year') {
            date.year(date.newDate);
        }
    }

    // Sort
    $scope.switchSortBy = function(predicate) {
        if (predicate === $scope.sort.predicate) {
            $scope.sort.reverse = ! $scope.sort.reverse;
        }
        else {
            $scope.sort.predicate = predicate;
            $scope.sort.reverse = false;
        }
    };

    $scope.resetSort = function() {
        $scope.sort.predicate = 'headline';
        $scope.sort.reverse = false;
    }
}
