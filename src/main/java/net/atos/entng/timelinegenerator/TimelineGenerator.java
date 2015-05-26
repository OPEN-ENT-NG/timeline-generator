package net.atos.entng.timelinegenerator;

import net.atos.entng.timelinegenerator.controllers.EventController;
import net.atos.entng.timelinegenerator.controllers.TimelineController;
import net.atos.entng.timelinegenerator.services.impl.EventServiceMongoImpl;

import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.service.CrudService;


public class TimelineGenerator extends BaseServer {
	
	public final static String TIMELINE_GENERATOR_COLLECTION = "timelinegenerator";
	public final static String TIMELINE_GENERATOR_EVENT_COLLECTION = "timelinegeneratorevent";

    public static final String MANAGE_RIGHT_ACTION = "net-atos-entng-timelinegenerator-controllers-TimelineController|updateTimeline";

	final CrudService eventService = new EventServiceMongoImpl(TIMELINE_GENERATOR_EVENT_COLLECTION);
	
	@Override
	public void start() {
		final MongoDbConf conf = MongoDbConf.getInstance();
		conf.setCollection(TIMELINE_GENERATOR_COLLECTION);
		conf.setResourceIdLabel("id");
		
		super.start();
		setDefaultResourceFilter(new ShareAndOwner());

        setRepositoryEvents(new TimelineGeneratorRepositoryEvents());

		addController(new TimelineController(TIMELINE_GENERATOR_COLLECTION));
		addController(new EventController(TIMELINE_GENERATOR_EVENT_COLLECTION, eventService));
	}

	
}