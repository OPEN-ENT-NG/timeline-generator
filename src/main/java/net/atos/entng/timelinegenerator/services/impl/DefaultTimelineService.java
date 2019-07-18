package net.atos.entng.timelinegenerator.services.impl;

import net.atos.entng.timelinegenerator.TimelineGenerator;
import net.atos.entng.timelinegenerator.services.TimelineService;
import org.entcore.common.service.impl.MongoDbCrudService;

public class DefaultTimelineService extends MongoDbCrudService implements TimelineService {

	public DefaultTimelineService() {
		super(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION);
	}

}
