import { model, Behaviours, http, _, Collection, notify, moment } from 'entcore'
import { timelineNamespace } from './models/model'

declare let $: any;
declare let createStoryJS: any;
declare let userLanguage: any;
declare let window: any;

let Event = timelineNamespace.Event;

console.log('timelinegenerator behaviours loaded');

(model as any).momentDateFormat = {
	"year" : "YYYY",
	"month": "MM/YYYY",
	"day": "DD/MM/YYYY"
};

(model as any).timelineJSDateFormat = {
	"year": "YYYY",
	"month": "YYYY,MM",
	"day": "YYYY,MM,DD"
};

(model as any).datePickerDateFormat = {
	"year" : "yyyy",
	"month": "mm/yyyy",
	"day": "dd/mm/yyyy"
};

(model as any).inputPlaceholderDateFormat = {
	"year": "année",
	"month": "mois/année",
	"day": "jour/mois/année"
};

let timelineGeneratorBehaviours = {
	resources: {
		contrib: {
			right: 'net-atos-entng-timelinegenerator-controllers-EventController|createEvent'
		},
		manage: {
			right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|updateTimeline'
		},
		share: {
			right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|shareTimeline'
		}
	},
	workflow : {
		createFolder:'net.atos.entng.timelinegenerator.controllers.FoldersController|add',
        create: 'net.atos.entng.timelinegenerator.controllers.TimelineController|createTimeline',
        view: 'net.atos.entng.timelinegenerator.controllers.TimelineController|view',
        publish: 'net.atos.entng.timelinegenerator.controllers.TimelineController|publish'
    },
	viewRights: [ 'net-atos-entng-timelinegenerator-controllers-TimelineController|view' ]
};

Behaviours.register('timelinegenerator', {
	behaviours:  timelineGeneratorBehaviours,
	rights: {
		resource: {
			contrib: {
				right: 'net-atos-entng-timelinegenerator-controllers-EventController|createEvent'
			},
			manage: {
				right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|updateTimeline'
			},
			manager: {
				right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|updateTimeline'
			},
			share: {
				right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|shareTimeline'
			}
		}
	},
	resourceRights: function(resource){
		var rightsContainer = resource;
		if(resource instanceof Event && resource.timeline){
			rightsContainer = resource.timeline;
		}
		if(!resource.myRights){
			resource.myRights = {};
		}

		for(var behaviour in timelineGeneratorBehaviours.resources){
			if(model.me.hasRight(rightsContainer, timelineGeneratorBehaviours.resources[behaviour]) ||
					model.me.userId === resource.owner.userId  ||
					model.me.userId === rightsContainer.owner.userId){
				if(resource.myRights[behaviour] !== undefined){
					resource.myRights[behaviour] = resource.myRights[behaviour] && timelineGeneratorBehaviours.resources[behaviour];
				}
				else{
					resource.myRights[behaviour] = timelineGeneratorBehaviours.resources[behaviour];
				}
			}
		}
		return resource;
	},

    /**
     * Allows to load workflow rights according to rights defined by the
     * administrator for the current user in the console.
     */
    workflow : function() {
        var workflow = {};

        var timelineGeneratorWorkflow = timelineGeneratorBehaviours.workflow;
        for ( var prop in timelineGeneratorWorkflow) {
            if (model.me.hasWorkflow(timelineGeneratorWorkflow[prop])) {
                workflow[prop] = true;
            }
        }
        return workflow;
    },

	loadResources: function() {
		return new Promise((resolve, reject) => {
			http().get('/timelinegenerator/timelines').done(function(timelines){
				this.resources = _.map(timelines, function(timeline) {
					let timelineIcon = timeline.icon;
					if (!timelineIcon) {
						timelineIcon = "/img/illustrations/timeline-default.png";
					}
					return {
						title : timeline.headline,
						ownerName : timeline.owner.displayName,
						owner : timeline.owner.userId,
						icon : timelineIcon,
						path : '/timelinegenerator#/view/' + timeline._id,
						_id : timeline._id
					};
				});
				resolve(this.resources);
			}.bind(this));
		});
	},
	sniplets: {
		timelines: {
			title: 'timelinegenerator.sniplet.title',
			description: 'timelinegenerator.sniplet.desc',
			controller: {
				init: function(){
					var scope = this;
					http().get('/timelinegenerator/public/js/storyjs-embed.js').done(function(){
						http().get('/timelinegenerator/timeline/' + this.source._id).done(function(timeline){
							http().get('/userbook/preference/language').done(function(response){
								if (!response.preference)
									scope.userLanguage = navigator.language || (navigator as any).userLanguage;
								else
									scope.userLanguage = response.preference.split(':')[1].split('\"', 2)[1];
							});
							scope.source = new timelineNamespace.Timeline(timeline);
							scope.source.events.sync(function() {
								
								// Hack to display more than one timeline in the same page
								// https://github.com/NUKnightLab/TimelineJS/issues/591
								var injectedScript = function() {
									createStoryJS({
										type:       'timeline',
										width:      '100%',
										height:     '600',
										source:     timeline,
										embed_id:   'timeline',
										lang:	 	userLanguage,
										css: 		'/timelinegenerator/public/css/timeline/timeline.css',
										js: 		'/timelinegenerator/public/js/timeline-min.js'
									});
								};
								
								// Hack to inject and instantiate mathJax lib to iframe
								var injectMathScript = function () {

									if (window.MathJax && window.MathJax.Hub) {
										setTimeout(() => {
											window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
											// tricks to keep calling mathJax since we keep having bad values
											let $navigation: JQuery = $('.nav-next, .nav-previous, .marker');
											$navigation.click(() =>{
												// tricks to keep calling mathJax and other potential lost libs
												// since we keep having bad interpreter values
												window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
											});
										}, 1500);
									}
								};

								var innerDoc = $('#' + scope.source._id)[0].contentWindow.document;

								innerDoc.open();
								innerDoc.write("<html><head>" +
									"<script src='/infra/public/mathjax/MathJax.js'></script>" +
									"<script>window.MathJax.Hub.Config({messageStyle: 'none', tex2jax: { preview: 'none' }," +
									" jax: [\"input/TeX\", \"output/CommonHTML\"]," +
									" extensions: [\"tex2jax.js\", \"MathMenu.js\", \"MathZoom.js\"]," +
									"TeX: {extensions: [\"AMSmath.js\", \"AMSsymbols.js\", \"noErrors.js\", \"noUndefined.js\"]}});</script>" +
									"<title></title><base target='_parent'/></head><body><div id='timeline'></div>"+
									"<script src='/infra/public/js/jquery-1.10.2.min.js'></script>" +
									"<script src='/timelinegenerator/public/js/storyjs-embed.js'></script>" +
									"<script>var timeline = "+ JSON.stringify(scope.source.toTimelineJsJSON()) + ";</script>" +
									"<script>var userLanguage = '" + scope.userLanguage + "';</script>" +
									"<script>var injectedScript= "+ injectedScript + ";injectedScript();</script>" +
									"<script>var injectMathScript= "+ injectMathScript + "; injectMathScript();</script>" +
									"</body></html>");
								innerDoc.close();
								
							});
						}.bind(this));
					}.bind(this));
				},
				initSource: function(){
					Behaviours.applicationsBehaviours.timelinegenerator.loadResources().then(function(resources){
						this.timelines = resources;
						this.$apply('timelines');
					}.bind(this));
				},
				setSource: function(source){
					this.setSnipletSource({
						_id: source._id
					});
					this.snipletResource.synchronizeRights(); // propagate rights from sniplet to timeline
				},
				copyRights: function(snipletResource, source){
					source.timelines.forEach(function(timeline){
						const copyRights:any = Behaviours.copyRights;
						copyRights(snipletResource, timeline, timelineGeneratorBehaviours.viewRights, 'timeline');
					});
				},
				
                /* Function used by application "Pages", to copy rights from "Pages" to resources. 
                 * It returns an array containing all resources' ids which are concerned by the rights copy.
                 * For sniplet "Timelinegenerator", copy rights from "Pages" to associated timeline */
                getReferencedResources: function(source){
                    if(source._id){
                        return [source._id];
                    }
                },
			}
		}
	},
	timelineNamespace: timelineNamespace
});
