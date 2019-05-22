import { model, http, _, notify, moment, Behaviours, Collection } from 'entcore'

export let timelineNamespace: any = {};

timelineNamespace.Event = function(){};

timelineNamespace.Timeline = function(){
	let timeline = this;
	Object.defineProperty(this, "myRights",{get : function(){ return this.rights.myRights; }})
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
};

timelineNamespace.Timeline.prototype = {
	saveModifications: function(callback){
		http().putJson('/timelinegenerator/timeline/' + this._id, this).done(function(e){
			notify.info('timelinegenerator.timeline.modification.saved');
			if(typeof callback === 'function'){
				callback();
			}
		});
	},
	save: function(callback){
		if(this._id){
			this.saveModifications(callback);
		}
		else{
			this.createTimeline(callback);
		}
	},
	createTimeline: function(cb){
		let timeline = this;
		http().postJson('/timelinegenerator/timelines', this).done(function(e){
			timeline.updateData(e);
			if(typeof cb === 'function'){
				cb();
			}
		}.bind(this));
	},
	open: function(cb){
		this.events.one('sync', function(){
			if(typeof cb === 'function'){
				cb();
			}
		}.bind(this));
		this.events.sync();
	},
	addEvent: function(event, cb){
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
	},
	toJSON: function(){
		return {
			headline: this.headline,
			text: this.text,
			type: 'default',
			icon: this.icon
		}
	},
	toTimelineJsJSON: function() {
		let timeline = this;
		let timelineDescription = timeline.text ? timeline.text : " ";
		let objectData = {
			"timeline" : {
				"headline": timeline.headline,
				"type": timeline.type,
				"text": timelineDescription,
				"asset": timeline.asset,
				"date":	timeline.date
			}
		};
		if (timeline.icon) {
			objectData.timeline.asset = {};
			objectData.timeline.asset.media = window.location.protocol + "//" + window.location.host + timeline.icon;
		}
		objectData.timeline.date = [];
		timeline.events.forEach(function(event) {
			let eventDescription = event.text ? event.text : " ";
			let eventData = {
				"headline" : event.headline,
				"startDate" : moment(event.startDate).format((model as any).timelineJSDateFormat[event.dateFormat]),
				"endDate": moment(event.endDate).format((model as any).timelineJSDateFormat[event.dateFormat]),
				"text" : eventDescription,
				"asset": event.asset
			};
			if (event.img || event.video) {
				eventData.asset = {};
				eventData.asset.media = event.img ? window.location.protocol + "//" + window.location.host + event.img : event.video;
			}
			if (event.endDate) {
				eventData.endDate = moment(event.endDate).format((model as any).timelineJSDateFormat[event.dateFormat]);
			}
			objectData.timeline.date.push(eventData);
		});
	
		console.log(objectData);
		return objectData;
	},
};


timelineNamespace.Event.prototype = {
	Event: function(){},
	save: function(cb){
		if(this._id){
			this.saveModifications(cb);
		}
		else{
			this.createEvent(cb);
		}
	},
	saveModifications: function(cb){
		http().putJson('/timelinegenerator/timeline/' + this.timeline._id + '/event/' + this._id, this).done(function(e){
			if(typeof cb === 'function'){
				cb();
			}
		});
	},
	createEvent: function(cb){
		let event = this;
		http().postJson('/timelinegenerator/timeline/' + this.timeline._id + '/events', this).done(function(e){
			event.updateData(e);
			if(typeof cb === 'function'){
				cb();
			}
		}.bind(this));
	},
	open: function(cb){
		cb();
	},
	toJSON: function(){
		let jsonEvent = {
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
	},
	timeline: {}
};

model.makeModels(timelineNamespace);