model.momentDateFormat = {
	"year" : "YYYY",
	"month": "MM/YYYY",
	"day": "DD/MM/YYYY"
}

model.timelineJSDateFormat = {
	"year": "YYYY",
	"month": "YYYY,MM",
	"day": "YYYY,MM,DD"
}

model.datePickerDateFormat = {
	"year" : "yyyy",
	"month": "mm/yyyy",
	"day": "dd/mm/yyyy"
}

model.inputPlaceholderDateFormat = {
	"year": "année",
	"month": "mois/année",
	"day": "jour/mois/année"
}


model.build = function(){
	loader.loadFile('/timelinegenerator/public/js/additional.js');
	this.makeModel(Behaviours.applicationsBehaviours.timelinegenerator.timelineNamespace.Timeline);
	this.makeModel(Behaviours.applicationsBehaviours.timelinegenerator.timelineNamespace.Event);

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