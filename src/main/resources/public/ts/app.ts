import { Behaviours, model, ng, routes } from 'entcore';
import { timelineGeneratorController } from './controller';
import { datePickerTimeline } from './additional';
import { LibraryServiceProvider } from "entcore/types/src/ts/library/library.service";
import { Timeline } from "./models/timeline";
import { IdAndLibraryResourceInformation } from 'entcore/types/src/ts/library/library.types';

ng.configs.push(ng.config(['libraryServiceProvider', function (libraryServiceProvider: LibraryServiceProvider<Timeline>) {
    libraryServiceProvider.setInvokableResourceInformationGetterFromResource(function () {
        return function (resource: Timeline): IdAndLibraryResourceInformation {
            return {
                id: resource._id, 
                resourceInformation: {
                    title: resource.title, 
                    cover: resource.icon,
                    application: "TimelineGenerator",
                    pdfUri: `/timelinegenerator/print#/print/${resource._id}`
                }
            };
        };
    });
}]));

ng.configs.push(ng.config(['$sceProvider', function ($sceProvider: any) {
    $sceProvider.enabled(false);
}]));

routes.define(function ($routeProvider) {
    $routeProvider.when('/view/:timelineId', {
        action: 'goToTimeline'
    }).when('/print/:timelineId', {
        action: 'print'
    }).when('/timeline/:timelineId/:eventId', {
        action: 'goToEvent'
    }).otherwise({
        action: 'mainPage'
    });
});

ng.controllers.push(timelineGeneratorController);
ng.directives.push(datePickerTimeline);

model.build = function () {
    this.makeModels(Behaviours.applicationsBehaviours.timelinegenerator.timelineNamespace);
};