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
import net.atos.entng.timelinegenerator.controllers.FoldersController;
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
import org.entcore.common.service.impl.MongoDbRepositoryEvents;
import org.entcore.common.service.impl.MongoDbSearchService;

import java.util.HashMap;
import java.util.Map;


public class TimelineGenerator extends BaseServer {

	// Define the explorer application name
	public static final String APPLICATION = "timelinegenerator";
	// Define the explorer type
	public static final String TYPE = "timelinegenerator";
	// Define the mongodb main collection name
	public final static String TIMELINE_GENERATOR_COLLECTION = "timelinegenerator";
	// Define the mongodb event collection name
	public final static String TIMELINE_GENERATOR_EVENT_COLLECTION = "timelinegeneratorevent";

    public static final String MANAGE_RIGHT_ACTION = "net-atos-entng-timelinegenerator-controllers-TimelineController|updateTimeline";

	private TimelineGeneratorExplorerPlugin explorerPlugin;

	final CrudService eventService = new EventServiceMongoImpl(TIMELINE_GENERATOR_EVENT_COLLECTION);

	@Override
	public void start() throws Exception {
		super.start();

		// Create Explorer plugin
		this.explorerPlugin = TimelineGeneratorExplorerPlugin.create(securedActions);

		// Mongo Conf
		final MongoDbConf conf = MongoDbConf.getInstance();
		// Set the main collection
		conf.setCollection(TIMELINE_GENERATOR_COLLECTION);
		conf.setResourceIdLabel("id");
		conf.addSearchTextField(TIMELINE_GENERATOR_COLLECTION + ".text");

		// Define resource filter
		setDefaultResourceFilter(new ShareAndOwner());

		// Create Repository Event with Explorer Proxy
		final IExplorerPluginClient mainClient = IExplorerPluginClient.withBus(vertx, APPLICATION, TYPE);
		final Map<String, IExplorerPluginClient> pluginClientPerCollection = new HashMap<>();
		pluginClientPerCollection.put(TIMELINE_GENERATOR_COLLECTION, mainClient);
		setRepositoryEvents(new ExplorerRepositoryEvents(new MongoDbRepositoryEvents(vertx), pluginClientPerCollection, mainClient));

		// Add Controllers and Services
		final TimelineService timelineService = new DefaultTimelineService();
		final TimelineController timelineController = new TimelineController(TIMELINE_GENERATOR_COLLECTION, explorerPlugin);
		timelineController.setTimelineService(timelineService);
		timelineController.setEventService((EventService) eventService);
		addController(timelineController);
		addController(new EventController(TIMELINE_GENERATOR_EVENT_COLLECTION, eventService));
		addController(new FoldersController("timelinegeneratorFolders"));

		if (config.getBoolean("searching-event", true)) {
			setSearchingEvents(new TimelineGeneratorSearchingEvents(new MongoDbSearchService(TIMELINE_GENERATOR_COLLECTION)));
		}

		// Start Explorer plugin
		this.explorerPlugin.start();
	}

	
}