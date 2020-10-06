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

package net.atos.entng.timelinegenerator.helpers;

import static org.entcore.common.http.response.DefaultResponseHandler.arrayResponseHandler;
import static org.entcore.common.http.response.DefaultResponseHandler.defaultResponseHandler;
import static org.entcore.common.http.response.DefaultResponseHandler.notEmptyResponseHandler;

import fr.wseduc.webutils.Either;
import net.atos.entng.timelinegenerator.TimelineGenerator;
import net.atos.entng.timelinegenerator.services.EventService;

import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.service.CrudService;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;

import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.RequestUtils;

public class EventHelper extends MongoDbControllerHelper {
	static final String RESOURCE_NAME = "timelinegenerator_event";

	private static final String TIMELINE_ID_PARAMETER = "id";
	private static final String EVENT_ID_PARAMETER = "eventid";

	private final EventService eventService;
	private final org.entcore.common.events.EventHelper eventHelper;

	
	public EventHelper(String collection, CrudService eventService) {
		super(collection, null);
		this.eventService = (EventService) eventService;
		this.crudService = eventService;
		final EventStore eventStore = EventStoreFactory.getFactory().getEventStore(TimelineGenerator.class.getSimpleName());
		this.eventHelper = new org.entcore.common.events.EventHelper(eventStore);
	}

	@Override
	public void list(final HttpServerRequest request) {
		
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				String timelineId = request.params().get(TIMELINE_ID_PARAMETER);
				eventService.list(timelineId, user, arrayResponseHandler(request));
			}
		});

	}

	@Override
	public void create(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {		
			@Override
			public void handle(final UserInfos user) {
				final String timelineId = request.params().get(TIMELINE_ID_PARAMETER);
				if (user != null) {
					RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
						@Override
						public void handle(JsonObject object) {
							final Handler<Either<String, JsonObject>> handler = notEmptyResponseHandler(request);
							eventService.create(timelineId, object, user, eventHelper.onCreateResource(request, RESOURCE_NAME, handler));
						}
					});
				} else {
					log.debug("User not found in session.");
					Renders.unauthorized(request);
				}
			}
		});
	}

	@Override
	public void update(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
						@Override
						public void handle(JsonObject object) {
							String id = request.params().get(EVENT_ID_PARAMETER);
							crudService.update(id, object, user, notEmptyResponseHandler(request));
						}
					});
				} else {
					log.debug("User not found in session.");
					Renders.unauthorized(request);
				}
			}
		});
	}

	@Override
	public void retrieve(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				String timelineId = request.params().get(TIMELINE_ID_PARAMETER);
				String eventId = request.params().get(EVENT_ID_PARAMETER);

				eventService.retrieve(timelineId, eventId, user, notEmptyResponseHandler(request));
			}
		});
	}

	@Override
	public void delete(final HttpServerRequest request) {

		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				final String timelineId = request.params().get(TIMELINE_ID_PARAMETER);
				final String eventId = request.params().get(EVENT_ID_PARAMETER);

				eventService.delete(timelineId, eventId, user, defaultResponseHandler(request));
			}
		});
	}
}
