
loader.loadFile('/timelinegenerator/public/js/storyjs-embed.js');

var timelineNamespace = {
	Event: function(){
		var event = this;
	},

	Timeline: function(){
	 	var timeline = this;

	 	this.collection(Event, {
			sync: function(callback){
				http().get('/timelinegenerator/timeline/' + timeline._id + '/events').done(function(events){
					_.each(events, function(event){
						event.timeline = timeline;
					});
					this.load(events);
					if(typeof callback === 'function'){
						callback();
					}
				}.bind(this));
			},
			removeSelection: function(callback){
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
					});
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
		this.saveModifications();
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
	}
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
	}
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
	return {
		headline: this.headline,
		text: this.text,
		locked: this.locked,
		startDate: this.startDate,
		endDate: this.endDate
	}
};

model.makeModels(timelineNamespace);

var timelineGeneratorBehaviours = {
	resources: {
		contrib: {
			right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|createTimeline'
		},
		manage: {
			right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|updateTimeline'
		},
		share: {
			right: 'net-atos-entng-timelinegenerator-controllers-TimelineController|shareTimeline'
		}
	},
	viewRights: [ 'net-atos-entng-timelimakeModelsnegenerator-controllers-TimelineController|view' ]
};

Behaviours.register('timelinegenerator', {
	behaviours:  timelineGeneratorBehaviours,
	resource: function(resource){
		var rightsContainer = resource;
		if(resource instanceof Event && resource.timeline){
			rightsContainer = resource.timeline;
		}
		if(!resource.myRights){
			resource.myRights = {};
		}

		for(var behaviour in timelineGeneratorBehaviours.resources){
			if(model.me.hasRight(rightsContainer, timelineGeneratorBehaviours.resources[behaviour]) 
					|| model.me.userId === resource.owner.userId 
					|| model.me.userId === rightsContainer.owner.userId){
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
	resourceRights: function(){
		return ['read', 'contrib', 'manager']
	},
	sniplets: {
		timelines: {
			title: 'Timelines',
			description: 'Les timelines permettent d\'ajouter des frises chronologiques sur votre page',
			controller: {
				init: function(){
					var scope = this;
					http().get('/timelinegenerator/timeline/' + this.source._id).done(function(timeline){
						console.log(timeline);
						this.timeline = new timelineNamespace.Timeline(timeline);
						this.timeline.events.sync(function() {
							console.log("Timeline Events synced");
							console.log(this.timeline);
						});
					}.bind(this));
				},
				initSource: function(){
					console.log('Sniplet init source');
					this.loadTimelines();
				},
				setSource: function(source){
					this.setSnipletSource({
						_id: source._id
					});
				},
				copyRights: function(snipletResource, source){
					source.timelines.forEach(function(timeline){
						Behaviours.copyRights(snipletResource, timeline, timelineGeneratorBehaviours.viewRights, 'timeline');
					});
				},
				loadTimelines: function() {
					http().get('/timelinegenerator/timelines').done(function(timelines){
						this.timelines = timelines;
					}.bind(this));
				},
				toTimelineJsJSON: function() {
			        var objectData = {
			            "timeline" : {
			                "headline": this.timeline.headline,
			                "type": this.timeline.type,
			                "text": this.timeline.text
			            }
			        };
			        objectData["timeline"]["date"] = [];
			        this.timeline.events.forEach(function(event) {

			            var eventData = {
			                "headline" : event.headline,
			                "startDate" : moment(event.startDate).format("YYYY,MM,DD"),
			                "endDate" : moment(event.endDate).format("YYYY,MM,DD"),
			                "text" : event.text,
			            };
			            objectData["timeline"]["date"].push(eventData);
			        });
			        return objectData;
			    }
			}
		}
	},
	timelineNamespace: timelineNamespace
});