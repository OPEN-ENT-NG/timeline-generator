import { moment, Behaviours, ng, template, idiom as lang, embedderService, navigationGuardService } from 'entcore'
import { timelineNamespace } from './models/model'
import { LibraryDelegate, LibraryControllerScope } from './controllers/library';
import { TimelineModel, EventModel, EventsModel, TimelinesModel } from './controllers/commons';
import { Timeline as TimelineEntity } from './models/timeline';
import { Folders, Folder, Filters } from './models/folder';

declare let currentLanguage: any;
export interface TimelineGeneratorControllerScope {
    notFound: boolean
    printMode: boolean
    template: typeof template
    timelines: TimelinesModel
    model: typeof timelineNamespace
    display: {
        confirmDeleteEvents?: boolean
        isEditingInfos?: boolean
    }
    me: any
    date: typeof moment
    moment: typeof moment
    previewMode: boolean
    lang: typeof lang
    editedEvent: EventModel
    sort: {
        predicate: string,
        reverse: boolean
    }
    events: EventsModel
    timeline: TimelineModel
    selectedTimeline: boolean | TimelineModel
    event: EventModel
    forceToClose:boolean
    safeApply(fn?:any);
    openMainPage(): void
    newTimeline(): void;
    openTimelineViewer(timeline: TimelineModel): void
    openTimelinePrinter(timeline: TimelineModel): void
    openTimeline(timeline: TimelineModel): void
    newEvent(): void
    duplicateTimeline(): void
    setEventMediaType(event: EventModel): void
    isTitleEmpty(title: string): boolean;
    addEvent(): void
    saveTimelineEdit(): void
    cancelTimelineEdit(): void
    saveEventEdit(): void
    cancelEventEdit(): void
    editTimeline(): void
    editEvent(eventModel: EventModel, event: Event): void
    shareTimeline(timeline: TimelineModel, event: Event): void
    isTextEmpty(str: string): boolean
    confirmRemoveSelectedEvents(): void
    removeSelectedEvents(): void
    cancelRemoveSubjects(): void
    resetEventImage(event: EventModel): void;
    resetEventVideo(event: EventModel): void
    switchDateFormat(): void
    resetEndDate(): void
    setDateYear(date: { newDate: string, month(num: number), year(num: number | string) }): void
    switchSortBy(predicate: string): void
    resetSort(): void
    formatDate(date: typeof moment): void
    canManageTimeline(timeline: TimelineModel): boolean
    openTl(id: string): void
    getTimelineThumbnail(timeline: TimelineModel): void
    //
    $apply: any
}
export interface TimelineGeneratorControllerScopeWithDelegate extends TimelineGeneratorControllerScope, LibraryControllerScope {

}
export const timelineGeneratorController = ng.controller('TimelineGeneratorController', ['$scope', 'model', 'route', '$rootScope', '$location', '$sce', ($scope: TimelineGeneratorControllerScopeWithDelegate, model, route, $rootScope, $location, $sce) => {
    $scope.notFound = false;
    $scope.template = template;
    $scope.printMode = false;
    $scope.model = timelineNamespace;
    $scope.display = {};
    $scope.me = model.me;
    $scope.date = moment;
    $scope.moment = moment;
    $scope.previewMode = false;
    $scope.lang = lang;
    $scope.forceToClose=false;

    $scope.editedEvent = new timelineNamespace.Event();

    $scope.sort = {
        predicate: 'headline',
        reverse: false
    };

    template.open('side-panel', 'timeline-side-panel');
    //DELEGATE
    LibraryDelegate($scope, $rootScope, $location);
    // Definition of actions
    route({
        goToTimeline: function (params) {
            template.open('timelines', 'timelines');
            const _timeline = new TimelineEntity({ _id: params.timelineId as string } as any);
            _timeline.sync().then(async () => {
                $scope.timeline = new timelineNamespace.Timeline(_timeline);
                $scope.timeline.behaviours()
                $scope.notFound = false;
                $scope.openTimelineViewer($scope.timeline);
            }).catch(e => {
                $scope.notFound = true;
                $scope.openMainPage();
            })
            $scope.display.isEditingInfos = false;
        },
        print: function (params) {
            template.open('timelines', 'timelines');
            const _timeline = new TimelineEntity({ _id: params.timelineId as string } as any);
            _timeline.sync().then(async () => {
                $scope.timeline = new timelineNamespace.Timeline(_timeline);
                $scope.timeline.behaviours()
                $scope.notFound = false;
                $scope.printMode = true;
                $scope.openTimelinePrinter($scope.timeline);
            }).catch(e => {
                $scope.notFound = true;
                $scope.openMainPage();
            })
        },
        goToEvent: function (params) {
        },
        mainPage: function (params) {
            template.open('timelines', 'timelines');
            $scope.display.isEditingInfos = false;
        }
    });
    $scope.safeApply = function (fn) {
        const phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.openMainPage = function () {
        delete $scope.timeline;
        delete $scope.selectedTimeline;
        template.close('main');
        template.open('timelines', 'timelines');
        window.location.hash = "";
        $scope.display.isEditingInfos = false;
    };

    $scope.openTimeline = function (timeline) {
        $scope.timeline = $scope.selectedTimeline = timeline;
        $scope.events = timeline.events;
        $scope.previewMode = false;
        $scope.timeline.open(function () {
            template.close('main');
            template.open('timelines', 'events');
            $scope.$apply();
        });
        $scope.display.isEditingInfos = false;
    };

    $scope.openTimelineViewer = function (timeline) {
        $scope.timeline = timeline;
        $scope.events = timeline.events;
        $scope.previewMode = true;
        Behaviours.applicationsBehaviours.timelinegenerator.sniplets.timelines.controller.source = timeline;
        timeline.open(function () {
            template.close('main');
            template.open('timelines', 'read-timeline');
        });
        $scope.display.isEditingInfos = false;
    };

    $scope.openTimelinePrinter = function (timeline) {
        $scope.timeline = timeline;
        $scope.events = timeline.events;
        $scope.previewMode = true;
        Behaviours.applicationsBehaviours.timelinegenerator.sniplets.timelines.controller.source = timeline;
        timeline.open(async function () {
            for(const ev of timeline.events.all){
                if(ev.video){
                    ev.videoHtml = await embedderService.getHtmlForUrl(ev.video, true);
                    ev.videoHtmlTrusted = $sce.trustAsHtml(ev.videoHtml);
                }
            }
            template.close('main');
            template.open('timelines', 'print-timeline');
            setTimeout(()=>window.print(),3000);
        });
    };

    $scope.newTimeline = function () {
        $scope.timeline = new timelineNamespace.Timeline();
        template.close('main');
        template.open('timelines', 'edit-timeline');
        $scope.selectedTimeline = true;
        $scope.display.isEditingInfos = false;
    };

    $scope.newEvent = function () {
        $scope.event = new timelineNamespace.Event();
        $scope.event.dateFormat = "day";
        $scope.event.startDate = moment();
        $scope.event.endDate = moment();
        $scope.setEventMediaType($scope.event);
        template.open('timelines', 'edit-event');
        $scope.display.isEditingInfos = false;
    };

    $scope.duplicateTimeline = function()
    {
        let t:TimelineEntity = ($scope.currentFolder.selection[0] as TimelineEntity);
        t.duplicate();
    };

    $scope.addEvent = function () {
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
        $scope.timeline.addEvent($scope.event, function () {
            if ($scope.previewMode) {
                $scope.openTimelineViewer($scope.timeline);
            } else {
                $scope.openTimeline($scope.timeline);
            }
        });
        $scope.display.isEditingInfos = false;
        $scope.forceToClose=false;
    };

    $scope.saveTimelineEdit = async function () {
        $scope.forceToClose=true;
        const _timeline = Folders.root.findRessource($scope.timeline._id) || new TimelineEntity();
        const isNew = !_timeline._id;
        _timeline.fromOldModel($scope.timeline)
        await _timeline.save();
        if (isNew && $scope.currentFolder && $scope.currentFolder._id) {
            await _timeline.moveTo($scope.currentFolder as Folder);
        }
        $scope.cancelTimelineEdit();
        if ($scope.currentFolder) {
            await $scope.currentFolder.sync();
        }
        if(isNew){
            Filters.mine = true;//enable filter to see the new scrapbook
            $scope.currentFolder.ressources.refreshFilters();
        }
        $scope.forceToClose=false;
        $scope.$apply();
    };

    $scope.saveEventEdit = function () {
        $scope.forceToClose=true;
        $scope.$apply();
        if (!$scope.event.enableEndDate) {
            $scope.event.endDate = "";
        }
        if ($scope.event._id) { // when editing an event
            $scope.event.save(function () {
                template.close('main');
                $scope.timeline.events.sync(function () {
                    $scope.cancelEventEdit();
                });
            });
        }
        else { // when creating an event
            $scope.addEvent();
        }
    };

    $scope.cancelEventEdit = function () {
        $scope.forceToClose=true;
        $scope.$apply();
        $scope.event = undefined;

        if ($scope.previewMode) {
            $scope.openTimelineViewer($scope.timeline);
            $scope.forceToClose=false;
        } else {
            $scope.openTimeline($scope.timeline);
            $scope.forceToClose=false;
        }
    };

    $scope.cancelTimelineEdit = function () {
        $scope.timeline = undefined;
        template.close('main');
        template.open('timelines', 'timelines');
        $scope.display.isEditingInfos = false;
    };

    $scope.editTimeline = function () {
        $scope.forceToClose=true;
        const json = $scope.currentFolder.selection[0].toJSON();
        $scope.timeline = new timelineNamespace.Timeline(json);
        template.open('timelines', 'edit-timeline');
        $scope.$apply();
        $scope.selectedTimeline = true;
        $scope.display.isEditingInfos = true;
        setTimeout(function() {
            $scope.forceToClose=false;
            $scope.$apply();
        }, 100);
    };

    $scope.editEvent = function (timelineEvent, event) {
        $scope.forceToClose=true;
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
        $scope.$apply();
        setTimeout(function () {
            template.open('timelines', 'edit-event');
            $scope.display.isEditingInfos = false;
            $scope.forceToClose=false;
            $scope.$apply();
            setTimeout(function () {
                $scope.setEventMediaType($scope.event);
                $scope.$apply();
                event && event.stopPropagation();
            }, 200);
        }, 0);
    };

    $scope.setEventMediaType = function (event) {
        if (event.video) {
            event.mediatype = 'video';
        } else {
            event.mediatype = 'img';
        }
    };

    $scope.shareTimeline = function (timeline, event) {
        $scope.timeline = timeline;
        $scope.displayLib.showShare = true;
        event && event.stopPropagation();
    };

    $scope.isTitleEmpty = function (str) {
        if (str !== undefined && str.replace(/ |&nbsp;/g, '') !== "") {
            return false;
        }
        return true;
    };

    $scope.isTextEmpty = function (str) {
        if (str !== undefined && str.replace(/<div class="ng-scope">|<\/div>|<br>|<p>|<\/p>|&nbsp;| /g, '') !== "") {
            return false;
        }
        return true;
    };


    $scope.confirmRemoveSelectedEvents = function () {
        $scope.display.confirmDeleteEvents = true;
    };

    $scope.removeSelectedEvents = function () {
        $scope.events.removeSelection(function () {
            $scope.display.confirmDeleteEvents = undefined;
        });
    };

    $scope.cancelRemoveSubjects = function () {
        $scope.display.confirmDeleteEvents = undefined;
    };

    $scope.resetEventImage = function (event) {
        event.img = '';
    };

    $scope.resetEventVideo = function (event) {
        event.video = '';
    };

    $scope.switchDateFormat = function () {
        if ($scope.event.dateFormat == 'year') {
            $scope.event.startDate.newDate = $scope.event.startDate.years();
            $scope.event.endDate.newDate = $scope.event.endDate.years();
        } else if ($scope.event.dateFormat == 'month') {
            $scope.event.startDate.newDate = $scope.event.startDate.format('MM/YYYY');
            $scope.event.endDate.newDate = $scope.event.endDate.format('MM/YYYY');
        }
    };

    $scope.resetEndDate = function () {
        if (!$scope.event.enableEndDate) {
            $scope.event.endDate = undefined;
        }
    };

    $scope.setDateYear = function (date) {
        if ($scope.event.dateFormat == 'month') {
            var splitted = date.newDate.split("/");
            date.month(parseInt(splitted[0]) - 1);
            date.year(splitted[1]);
        } else if ($scope.event.dateFormat == 'year') {
            date.year(date.newDate);
        }
    };

    // Sort
    $scope.switchSortBy = function (predicate) {
        if (predicate === $scope.sort.predicate) {
            $scope.sort.reverse = !$scope.sort.reverse;
        }
        else {
            $scope.sort.predicate = predicate;
            $scope.sort.reverse = false;
        }
    };

    $scope.resetSort = function () {
        $scope.sort.predicate = 'headline';
        $scope.sort.reverse = false;
    };

    /**
     * Display date in French format
     */
    $scope.formatDate = function (dateObject) {
        return moment(dateObject.$date).lang(currentLanguage).calendar();
    };

    /**
     * Checks if a user is a manager
     */
    $scope.canManageTimeline = function (timeline) {
        return timeline.myRights.manage !== undefined;
    };

    /**
     * Opens a timeline from the search bar or the main page
     */
    $scope.openTl = function (timelineId) {
        window.location.hash = '/view/' + timelineId;
        $scope.selectedTimeline = true;
    };


    /**
     * Retrieve the timeline thumbnail if there is one
     */
    $scope.getTimelineThumbnail = function (timeline) {
        if (!timeline.icon || timeline.icon === '') {
            return '/img/illustrations/image-default.svg';
        }
        return timeline.icon + '?thumbnail=120x120';
    };
}]);