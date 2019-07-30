import { routes, ng, model, http,  Behaviours, _ } from 'entcore'
import { timelineNamespace } from './models/model'
import { timelineGeneratorController } from './controller'
import { datePickerTimeline } from './additional'

routes.define(function($routeProvider) {
    $routeProvider.when('/view/:timelineId', {
        action : 'goToTimeline'
    }).when('/print/:timelineId', {
        action : 'print'
    }).when('/timeline/:timelineId/:eventId', {
        action : 'goToEvent'
    }).otherwise({
        action : 'mainPage'
    });
});

ng.controllers.push(timelineGeneratorController);
ng.directives.push(datePickerTimeline);

model.build = function(){
	this.makeModels(Behaviours.applicationsBehaviours.timelinegenerator.timelineNamespace);
};