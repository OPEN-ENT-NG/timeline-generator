import { routes, ng, model, http, loader, Behaviours, _, Collection, notify } from 'entcore'
import { timelineNamespace } from './model'
import { timelineGeneratorController } from './controller'
import { datePickerTimeline } from './additional'

routes.define(function($routeProvider) {
    $routeProvider.when('/view/:timelineId', {
        action : 'goToTimeline'
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

	this.collection(Behaviours.applicationsBehaviours.timelinegenerator.timelineNamespace.Timeline, {
		sync: function(callback){
			http().get('/timelinegenerator/timelines').done(function(timelines){
				this.load(timelines);
				if(typeof callback === 'function'){
					callback();
				}
			}.bind(this));
		},
		removeSelection: function(callback){
			var counter = this.selection().length;
			this.selection().forEach(function(item){
				http().delete('/timelinegenerator/timeline/' + item._id).done(function(){
					counter = counter - 1;
					if (counter === 0) {
						model.timelines.sync();
						if(typeof callback === 'function'){
							callback();
						}
					}
				});
			});
		}
	})
};