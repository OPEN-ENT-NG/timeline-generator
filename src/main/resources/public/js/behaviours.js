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
	}
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
	}
});