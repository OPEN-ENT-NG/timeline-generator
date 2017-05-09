routes.define(function($routeProvider) {
    $routeProvider.when('/view/:timelineId', {
        action : 'goToTimeline'
    }).when('/timeline/:timelineId/:eventId', {
        action : 'goToEvent'
    }).otherwise({
        action : 'mainPage'
    });
});

function TimelineGeneratorController($scope, template, model, lang, date, route) {
    $scope.notFound = false;
	$scope.template = template;
    $scope.timelines = model.timelines;
    $scope.model = model;
    $scope.display = {};
    $scope.me = model.me;
    $scope.date = date;
    $scope.moment = moment;
    $scope.searchbar = {};
    $scope.previewMode = false;
    $scope.lang = lang;

    $scope.editedEvent = new Event();

    $scope.sort = {
        predicate: 'headline',
        reverse: false
    };

    template.open('side-panel', 'timeline-side-panel');

    // Definition of actions
    route({
        goToTimeline : function(params) {
            template.open('timelines', 'timelines');

            var findTimelineInModel = function() {
            	return model.timelines.find(function(timeline) {
                    return timeline._id === params.timelineId;
                });
            };
            var openTlViewer = function() {
                $scope.notFound = false;
                $scope.openTimelineViewer($scope.timeline);
            };

            $scope.timeline = findTimelineInModel();

            if ($scope.timeline !== undefined) {
            	openTlViewer();
            }
            else {
                model.timelines.one('sync', function() {
                    $scope.timeline = findTimelineInModel();
                    if ($scope.timeline === undefined) {
                        $scope.notFound = true;
                        $scope.openMainPage();
                        //template.open('error', '404');
                    } else {
                    	openTlViewer();
                    }
                });
                model.timelines.sync();
            }
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
        delete $scope.selectedTimeline;
        $scope.timelines.forEach(function(tl) {
            tl.showButtons = false;
        });
		template.close('main');
        template.open('timelines', 'timelines');
        window.location.hash = "";
	};

    $scope.openTimeline = function(timeline){
        $scope.timeline = $scope.selectedTimeline = timeline;
        $scope.events = timeline.events;
        $scope.previewMode = false;
        $scope.timelines.forEach(function(tl) {
            if (tl._id != timeline._id) {
                tl.showButtons = false;
            }
        });
        $scope.timeline.open(function(){
            template.close('main');
            template.open('timelines', 'events');
            $scope.$apply();
        });
    };

     $scope.openTimelineViewer = function(timeline){
        $scope.timeline = timeline;
        $scope.events = timeline.events;
        $scope.previewMode = true;
        Behaviours.applicationsBehaviours.timelinegenerator.sniplets.timelines.controller.source = timeline;
        timeline.open(function(){
            template.close('main');
            template.open('timelines', 'read-timeline');
        });
    };

    $scope.newTimeline = function(){
		$scope.timeline = new Timeline();
        template.close('main');
		template.open('timelines', 'edit-timeline');
        $scope.selectedTimeline = true;
	};

    $scope.newEvent = function(){
        $scope.event = new Event();
        $scope.event.dateFormat = "day";
        $scope.event.startDate = moment();
        $scope.event.endDate = moment();
        $scope.setEventMediaType($scope.event);
        template.open('timelines', 'edit-event');
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
            if ($scope.previewMode) {
                $scope.openTimelineViewer($scope.timeline);
            } else {
                $scope.openTimeline($scope.timeline);
            }
        });
    };

	$scope.saveTimelineEdit = function(){
		if ($scope.timeline._id) { // when editing a timeline
			$scope.timeline.save(function(){
				$scope.timelines.sync(function(){
                    $scope.updateSearchBar();
                    $scope.cancelTimelineEdit();
				});

			});
		}
		else { // when creating a timeline
		    $scope.timeline.save(function(){
                $scope.timelines.sync(function() {
                    $scope.updateSearchBar();
                    $scope.cancelTimelineEdit();
                });
			});
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

        if ($scope.previewMode) {
            $scope.openTimelineViewer($scope.timeline);
        } else {
            $scope.openTimeline($scope.timeline);
        }
    };

	$scope.cancelTimelineEdit = function(){
		$scope.timeline = undefined;
        $scope.timelines.forEach(function(tl) {
            tl.showButtons = false;
        });
		template.close('main');
        template.open('timelines', 'timelines');
	};

    $scope.editTimeline = function(timeline, event){
        $scope.timeline = timeline;
        event.stopPropagation();
        template.open('timelines', 'edit-timeline');
        $scope.selectedTimeline = true;

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
        template.open('timelines', 'edit-event');
    };

    $scope.setEventMediaType = function(event) {
         if (event.video) {
            event.mediatype = 'video';
        } else {
            event.mediatype = 'img';
        }
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
            $scope.updateSearchBar();
            $scope.display.confirmDeleteTimelines = undefined;
        });

        delete $scope.timeline;
        delete $scope.selectedTimeline;
        $scope.display.confirmDeleteTimelines = false;

    };

    $scope.cancelRemoveTimelines = function() {
        $scope.display.confirmDeleteTimelines = undefined;
    };

    $scope.isTitleEmpty = function(str) {
        if (str !== undefined && str.replace(/ |&nbsp;/g, '') !== "") {
            return false;
        }
        return true;
    };

    $scope.isTextEmpty = function(str) {
        if (str !== undefined && str.replace(/<div class="ng-scope">|<\/div>|<br>|<p>|<\/p>|&nbsp;| /g, '') !== "") {
            return false;
        }
        return true;
    };


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
    };

    $scope.resetEventVideo = function(event) {
        event.video = '';
    };

    $scope.switchDateFormat = function() {
        if ($scope.event.dateFormat == 'year') {
            $scope.event.startDate.newDate = $scope.event.startDate.years();
            $scope.event.endDate.newDate = $scope.event.endDate.years();
        } else if ($scope.event.dateFormat == 'month') {
            $scope.event.startDate.newDate = $scope.event.startDate.format('MM/YYYY');
            $scope.event.endDate.newDate = $scope.event.endDate.format('MM/YYYY');
        }
    };

    $scope.resetEndDate = function() {
        if (!$scope.event.enableEndDate) {
            $scope.event.endDate = undefined;
        }
    };

    $scope.setDateYear = function(date) {
        if ($scope.event.dateFormat == 'month') {
            var splitted = date.newDate.split("/");
            date.month(parseInt(splitted[0]) - 1);
            date.year(splitted[1]);
        } else if ($scope.event.dateFormat == 'year') {
            date.year(date.newDate);
        }
    };

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
    };

    /**
     * Display date in French format
     */
    $scope.formatDate = function(dateObject){
        return moment(dateObject.$date).lang(currentLanguage).calendar();
    };

    /**
     * Checks if a user is a manager
     */
    $scope.canManageTimeline = function(timeline){
        return timeline.myRights.manage !== undefined;
    };


    /**
     * Update the search bar according server timelines
     */
    $scope.updateSearchBar = function() {
        model.timelines.sync(function() {
            $scope.searchbar.timelines = $scope.timelines.all.map(function(timeline) {
                return {
                    title : timeline.headline,
                    _id : timeline._id,
                    toString : function() {
                                    return this.title;
                               }
                };
            });
        });
    };

    // Update search bar
    $scope.updateSearchBar();

    /**
     * Opens a timeline from the search bar or the main page
     */
    $scope.openTl = function(timelineId) {
        window.location.hash = '/view/' + timelineId;
        $scope.selectedTimeline = true;
    };


    /**
     * Retrieve the timeline thumbnail if there is one
     */
    $scope.getTimelineThumbnail = function(timeline){
        if(!timeline.icon || timeline.icon === ''){
            return '/img/illustrations/image-default.svg';
        }
        return timeline.icon + '?thumbnail=120x120';
    };
}
