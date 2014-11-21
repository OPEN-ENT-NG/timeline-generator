// Event Object
function Event(){
	var event = this;
}

Event.prototype.save = function(cb){
	if(this._id){
		this.saveModifications(cb);
	}
	else{
		this.createEvent(cb);
	}
};

Event.prototype.saveModifications = function(cb){
	http().putJson('/timelinegenerator/timeline/' + this.timeline._id + '/event/' + this._id, this).done(function(e){
		if(typeof cb === 'function'){
			cb();
		}
	});
};

Event.prototype.createEvent = function(cb){
	var event = this;
	http().postJson('/timelinegenerator/timeline/' + this.timeline._id + '/events', this).done(function(e){
		event.updateData(e);
		if(typeof cb === 'function'){
			cb();
		}
	}.bind(this));
};

Event.prototype.toJSON = function(){
	return {
		title: this.title,
		content: this.content,
		locked: this.locked
	}
};


// Timeline Object
function Timeline(){
 	var timeline = this;

 	this.collection(Event, {
		sync: function(){
			http().get('/timelinegenerator/timeline/' + timeline._id + '/events').done(function(events){
				_.each(events, function(event){
					event.timeline = timeline;
				});
				this.load(events);
			}.bind(this))
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
			notify.info('timelinegenerator.timeline.event.locked');
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
			notify.info('timelinegenerator.timeline.event.unlocked');
		},
		behaviours: 'timelinegenerator'
	});
 }

 Timeline.prototype.saveModifications = function(callback){
	http().putJson('/timelinegenerator/timeline/' + this._id, this).done(function(e){
		notify.info('timelinegenerator.timeline.modification.saved');
		if(typeof callback === 'function'){
			callback();
		}
	});
};

Timeline.prototype.save = function(callback){
	if(this._id){
		this.saveModifications();
	}
	else{
		this.createTimeline(callback);
	}
};

Timeline.prototype.createTimeline = function(cb){
    var timeline = this;
    http().postJson('/timelinegenerator/timelines', this).done(function(e){
        timeline.updateData(e);
        if(typeof cb === 'function'){
            cb();
        }
    }.bind(this));
};

Timeline.prototype.open = function(cb){
	this.events.one('sync', function(){
		if(typeof cb === 'function'){
			cb();
		}
	}.bind(this));
	this.events.sync();
};

Timeline.prototype.addEvent = function(event, cb){
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

Timeline.prototype.toJSON = function(){
	return {
		name: this.name,
		icon: this.icon
	}
};


model.build = function(){
	this.makeModel(Timeline);
	this.makeModel(Event);


	this.collection(Timeline, {
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