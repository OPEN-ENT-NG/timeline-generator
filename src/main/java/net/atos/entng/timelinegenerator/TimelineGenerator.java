/*
 * Copyright © Région Nord Pas de Calais-Picardie, 2016.
 *
 * This file is part of OPEN ENT NG. OPEN ENT NG is a versatile ENT Project based on the JVM and ENT Core Project.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation (version 3 of the License).
 *
 * For the sake of explanation, any module that communicate over native
 * Web protocols, such as HTTP, with OPEN ENT NG is outside the scope of this
 * license and could be license under its own terms. This is merely considered
 * normal use of OPEN ENT NG, and does not fall under the heading of "covered work".
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package net.atos.entng.timelinegenerator;

import net.atos.entng.timelinegenerator.controllers.EventController;
import net.atos.entng.timelinegenerator.controllers.TimelineController;
import net.atos.entng.timelinegenerator.events.TimelineGeneratorSearchingEvents;
import net.atos.entng.timelinegenerator.explorer.TimelineGeneratorExplorerPlugin;
import net.atos.entng.timelinegenerator.services.EventService;
import net.atos.entng.timelinegenerator.services.TimelineService;
import net.atos.entng.timelinegenerator.services.impl.DefaultTimelineService;
import net.atos.entng.timelinegenerator.services.impl.EventServiceMongoImpl;
import org.entcore.common.explorer.IExplorerPluginClient;
import org.entcore.common.explorer.impl.ExplorerRepositoryEvents;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.service.CrudService;
import org.entcore.common.service.impl.MongoDbSearchService;
import org.entcore.common.user.RepositoryEvents;

import java.util.HashMap;
import java.util.Map;


public class TimelineGenerator extends BaseServer {

	public final static String APPLICATION = "timelinegenerator";
	public final static String TIMELINE_GENERATOR_COLLECTION = "timelinegenerator";
	public final static String TIMELINE_GENERATOR_EVENT_COLLECTION = "timelinegeneratorevent";
	
	public final static String TIMELINE_GENERATOR_TYPE = "timelinegenerator"; // TODO add resource type
	public final static String TIMELINE_GENERATOR_EVENT_TYPE = "timelinegeneratorevent"; // TODO what is the subresource type?

    public static final String MANAGE_RIGHT_ACTION = "net-atos-entng-timelinegenerator-controllers-TimelineController|updateTimeline";

	TimelineGeneratorExplorerPlugin timelineGeneratorPlugin;

	final CrudService eventService = new EventServiceMongoImpl(TIMELINE_GENERATOR_EVENT_COLLECTION);
	
	@Override
	public void start() throws Exception {

		final MongoDbConf conf = createAndSetMogoDbConfAttributes();

		super.start();
		setDefaultResourceFilter(new ShareAndOwner());

		if (config.getBoolean("searching-event", true)) {
			setSearchingEvents(new TimelineGeneratorSearchingEvents(new MongoDbSearchService(TIMELINE_GENERATOR_COLLECTION)));
		}

		final IExplorerPluginClient mainClient = IExplorerPluginClient.withBus(vertx, TIMELINE_GENERATOR_COLLECTION, TIMELINE_GENERATOR_TYPE);

		final Map<String, IExplorerPluginClient> pluginClientPerCollection = createPluginPerCollection(mainClient);

		createAndSetRepositoryEvents(mainClient, pluginClientPerCollection);

		timelineGeneratorPlugin = TimelineGeneratorExplorerPlugin.create(securedActions);

		final TimelineService timelineService = new DefaultTimelineService(timelineGeneratorPlugin);

		TimelineController timelineController = new TimelineController(TIMELINE_GENERATOR_COLLECTION);
		timelineController.setTimelineService(timelineService);
		timelineController.setEventService((EventService) eventService);
		addController(timelineController);
		addController(new EventController(TIMELINE_GENERATOR_EVENT_COLLECTION, eventService));

		timelineGeneratorPlugin.start();

	}

	@Override
	public void stop() throws Exception {
		super.stop();
		if(timelineGeneratorPlugin != null) {
			timelineGeneratorPlugin.stop();
		}
	}


	private void createAndSetRepositoryEvents(final IExplorerPluginClient mainClient,
			final Map<String, IExplorerPluginClient> pluginClientPerCollection) {

		TimelineGeneratorRepositoryEvents timelineGeneratorRepositoryEvents = new TimelineGeneratorRepositoryEvents(vertx);
		RepositoryEvents explorerRepositoryEvents = new ExplorerRepositoryEvents(timelineGeneratorRepositoryEvents, pluginClientPerCollection, mainClient);

		setRepositoryEvents(explorerRepositoryEvents);
	}

	private Map<String, IExplorerPluginClient> createPluginPerCollection(final IExplorerPluginClient mainClient) {
		
		Map<String, IExplorerPluginClient> pluginClientPerCollection = new HashMap<>();

		pluginClientPerCollection.put(TIMELINE_GENERATOR_COLLECTION, mainClient);

		final IExplorerPluginClient subResourceClient = IExplorerPluginClient.withBus(vertx, TIMELINE_GENERATOR_COLLECTION, TIMELINE_GENERATOR_EVENT_TYPE);
		pluginClientPerCollection.put(TIMELINE_GENERATOR_EVENT_COLLECTION, subResourceClient);

		return pluginClientPerCollection;
	}

	private MongoDbConf createAndSetMogoDbConfAttributes() {
		MongoDbConf conf = MongoDbConf.getInstance();
		conf.setCollection(TIMELINE_GENERATOR_COLLECTION);
		conf.setResourceIdLabel("id");
		conf.addSearchTextField(TIMELINE_GENERATOR_COLLECTION + ".text");

		return conf;
	}


}