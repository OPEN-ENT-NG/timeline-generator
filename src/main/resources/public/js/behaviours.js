console.log('timelinegenerator behaviours loaded');

loader.loadFile('/timelinegenerator/public/js/storyjs-embed.js');

model.momentDateFormat = {
	"year" : "YYYY",
	"month": "MM/YYYY",
	"day": "DD/MM/YYYY"
};

model.timelineJSDateFormat = {
	"year": "YYYY",
	"month": "YYYY,MM",
	"day": "YYYY,MM,DD"
};

model.datePickerDateFormat = {
	"year" : "yyyy",
	"month": "mm/yyyy",
	"day": "dd/mm/yyyy"
};

model.inputPlaceholderDateFormat = {
	"year": "année",
	"month": "mois/année",
	"day": "jour/mois/année"
};

var timelineNamespace = {
	Event: function(){
	},

	Timeline: function(){
	 	var timeline = this;
	 	this.collection(Behaviours.applicationsBehaviours.timelinegenerator.timelineNamespace.Event, {
			sync: function(callback){
				http().get('/timelinegenerator/timeline/' + timeline._id + '/events').done(function(events){
					_.each(events, function(event){
						event.timeline = timeline;
						if (event.endDate === "") {
							event.endDate = undefined;
						}
						if (!event.dateFormat) {
							event.dateFormat = 'day';
						}
 					});
					this.load(events);
					if(typeof callback === 'function'){
						callback();
					}
				}.bind(this));
			},
			removeSelection: function(callback){
				var that = this;
				var counter = this.selection().length;
				this.selection().forEach(function(item){
					http().delete('/timelinegenerator/timeline/' + timeline._id + '/event/' + item._id).done(function(){
						counter = counter - 1;
						if (counter === 0) {
							Collection.prototype.removeSelection.call(this);
							timeline.events.sync();
							if(typeof callback === 'function'){
								callback();
							}
						}
					}.bind(that));
				});
			},
			lockSelection: function(){
				var counter = this.selection().length;
				this.selection().forEach(function(item){
					item.locked = true;
					http().putJson('/timelinegenerator/timeline/' + timeline._id + '/event/' + item._id, item).done(function(){
						counter = counter - 1;
						if (counter === 0) {
							timeline.events.sync();
						}
					});
				});
				notify.info('timelinegenerator.event.locked');
			},
			unlockSelection: function(){
				var counter = this.selection().length;
				this.selection().forEach(function(item){
					item.locked = false;
					http().putJson('/timelinegenerator/timeline/' + timeline._id + '/event/' + item._id, item).done(function(){
						counter = counter - 1;
						if (counter === 0) {
							timeline.events.sync();
						}
					});
				});
				notify.info('timelinegenerator.event.unlocked');
			},
			behaviours: 'timelinegenerator'
		});
	 }
};

timelineNamespace.Timeline.prototype.saveModifications = function(callback){
	http().putJson('/timelinegenerator/timeline/' + this._id, this).done(function(e){
		notify.info('timelinegenerator.timeline.modification.saved');
		if(typeof callback === 'function'){
			callback();
		}
	});
};

timelineNamespace.Timeline.prototype.save = function(callback){
	if(this._id){
		this.saveModifications(callback);
	}
	else{
		this.createTimeline(callback);
	}
};

timelineNamespace.Timeline.prototype.createTimeline = function(cb){
    var timeline = this;
    http().postJson('/timelinegenerator/timelines', this).done(function(e){
        timeline.updateData(e);
        if(typeof cb === 'function'){
            cb();
        }
    }.bind(this));
};

timelineNamespace.Timeline.prototype.open = function(cb){
	this.events.one('sync', function(){
		if(typeof cb === 'function'){
			cb();
		}
	}.bind(this));
	this.events.sync();
};

timelineNamespace.Timeline.prototype.addEvent = function(event, cb){
	event.timeline = this;
	event.owner = {
		userId: model.me.userId,
		displayName: model.me.username
	};
	this.events.push(event);
	event.save(function(){
		if(typeof cb === 'function'){
			cb();
		}
	}.bind(this));
};

timelineNamespace.Timeline.prototype.toJSON = function(){
	return {
		headline: this.headline,
		text: this.text,
		type: 'default',
		icon: this.icon
	};
};

timelineNamespace.Timeline.prototype.toTimelineJsJSON = function() {
	var timeline = this;
    var timelineDescription = timeline.text ? timeline.text : " ";
    var objectData = {
        "timeline" : {
            "headline": timeline.headline,
            "type": timeline.type,
            "text": timelineDescription,
        }
    };
    if (timeline.icon) {
    	objectData.timeline.asset = {};
    	objectData.timeline.asset.media = window.location.protocol + "//" + window.location.host + timeline.icon;
    }
    objectData.timeline.date = [];
    timeline.events.forEach(function(event) {
        var eventDescription = event.text ? event.text : " ";
        var eventData = {
            "headline" : event.headline,
            "startDate" : moment(event.startDate).format(model.timelineJSDateFormat[event.dateFormat]),
            "text" : eventDescription
        };
        if (event.img || event.video) {
        	eventData.asset = {};
        	eventData.asset.media = event.img ? window.location.protocol + "//" + window.location.host + event.img : event.video;
        }
        if (event.endDate) {
        	eventData.endDate = moment(event.endDate).format(model.timelineJSDateFormat[event.dateFormat]);
        }
        objectData.timeline.date.push(eventData);
    });

    console.log(objectData);
    return objectData;
};

timelineNamespace.Event.prototype.save = function(cb){
	if(this._id){
		this.saveModifications(cb);
	}
	else{
		this.createEvent(cb);
	}
};

timelineNamespace.Event.prototype.saveModifications = function(cb){
	http().putJson('/timelinegenerator/timeline/' + this.timeline._id + '/event/' + this._id, this).done(function(e){
		if(typeof cb === 'function'){
			cb();
		}
	});
};

timelineNamespace.Event.prototype.createEvent = function(cb){
	var event = this;
	http().postJson('/timelinegenerator/timeline/' + this.timeline._id + '/events', this).done(function(e){
		event.updateData(e);
		if(typeof cb === 'function'){
			cb();
		}
	}.bind(this));
};


timelineNamespace.Event.prototype.open = function(cb){
	cb();
};


timelineNamespace.Event.prototype.toJSON = function(){
	var jsonEvent = {
		headline: this.headline,
		text: this.text,
		locked: this.locked,
		startDate: this.startDate,
		endDate: this.endDate ? this.endDate : '',
		img: this.img,
		video: this.video,
		dateFormat: this.dateFormat
	};
	
	return jsonEvent;
};

model.makeModels(timelineNamespace);

var timelineGeneratorBehaviours = {
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
        create : 'net.atos.entng.timelinegenerator.controllers.TimelineController|createTimeline',
        view : 'net.atos.entng.timelinegenerator.controllers.TimelineController|view'
    },
	viewRights: [ 'net-atos-entng-timelinegenerator-controllers-TimelineController|view' ]
};

console.log(timelineGeneratorBehaviours);

Behaviours.register('timelinegenerator', {
	behaviours:  timelineGeneratorBehaviours,
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

	loadResources: function(callback) {
		http().get('/timelinegenerator/timelines').done(function(timelines){
            this.resources = _.map(timelines, function(timeline) {
                timelineIcon = timeline.icon;
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
            if(typeof callback === 'function'){
                callback(this.resources);
            }
		}.bind(this));
	},
	sniplets: {
		timelines: {
			title: 'Frises chronologiques',
			description: 'Permet d\'ajouter des frises chronologiques sur votre page',
			controller: {
				init: function(){
					var scope = this;
					http().get('/timelinegenerator/timeline/' + this.source._id).done(function(timeline){
						scope.source = new timelineNamespace.Timeline(timeline);
						scope.source.events.sync(function() {

							// Hack to display more than one timeline in the same page
							// https://github.com/NUKnightLab/TimelineJS/issues/591
							var injectedScript = function(){
								createStoryJS({
					                type:       'timeline',
					                width:      '100%',
					                height:     '600',
					                source:     timeline,
					                embed_id:   'timeline',
					                lang: 'fr',
					                css: '/timelinegenerator/public/css/timeline/timeline.css',
					                js: '/timelinegenerator/public/js/timeline-min.js'
			            		});
							};
							var innerDoc = $('#' + scope.source._id)[0].contentWindow.document;
							innerDoc.open();
							innerDoc.write("<html><head><title></title><base target='_parent' /></head><body><div id='timeline'></div>"+
							    "<script src='/infra/public/js/jquery-1.10.2.min.js'></script>" +
							    "<script src='/timelinegenerator/public/js/storyjs-embed.js'></script>" +

							    "<script>var timeline = "+ JSON.stringify(scope.source.toTimelineJsJSON()) + ";</script>" +
							    "<script>var injectedScript= "+ injectedScript + ";injectedScript();</script>" +
							    "</body></html>");
							innerDoc.close();
							
						});
					}.bind(this));
				},
				initSource: function(){
					Behaviours.applicationsBehaviours.timelinegenerator.loadResources(function(resources){
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
						Behaviours.copyRights(snipletResource, timeline, timelineGeneratorBehaviours.viewRights, 'timeline');
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
