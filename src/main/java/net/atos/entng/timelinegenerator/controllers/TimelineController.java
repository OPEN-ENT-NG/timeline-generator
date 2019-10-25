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

package net.atos.entng.timelinegenerator.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.mongodb.QueryBuilder;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.webutils.I18n;
import io.vertx.core.json.JsonArray;
import net.atos.entng.timelinegenerator.TimelineGenerator;

import net.atos.entng.timelinegenerator.services.EventService;
import net.atos.entng.timelinegenerator.services.TimelineService;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.filter.OwnerOnly;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import io.vertx.core.json.JsonObject;


import fr.wseduc.rs.ApiDoc;
import fr.wseduc.rs.Delete;
import fr.wseduc.rs.Get;
import fr.wseduc.rs.Post;
import fr.wseduc.rs.Put;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.request.RequestUtils;

import static org.entcore.common.http.response.DefaultResponseHandler.leftToResponse;


public class TimelineController extends MongoDbControllerHelper {

	// Used for module "statistics"
	private EventStore eventStore;
	private TimelineService timelineService;
	private EventService eventService;

	private enum TimelineGeneratorEvent { ACCESS }


	@Override
	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
			Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super.init(vertx, config, rm, securedActions);
		eventStore = EventStoreFactory.getFactory().getEventStore(TimelineGenerator.class.getSimpleName());
	}

	public TimelineController(String collection) {
		super(collection);
	}

	@Get("")
	@SecuredAction("timelinegenerator.view")
	public void view(HttpServerRequest request) {
		renderView(request);

		// Create event "access to application TimelineGenerator" and store it, for module "statistics"
		eventStore.createAndStoreEvent(TimelineGeneratorEvent.ACCESS.name(), request);
	}

	@Get("/print")
	@SecuredAction("timelinegenerator.print")
	public void printView(HttpServerRequest request) {
        renderView(request, new JsonObject(), "timelinegenerator-print.html", null);
	}

	@Get("/timelines")
	@SecuredAction("timelinegenerator.list")
	public void listTimelines(HttpServerRequest request) {
		list(request);
	}

	@Get("/timeline/:id")
	@SecuredAction(value = "timelinegenerator.read", type = ActionType.RESOURCE)
	public void getTimeline(HttpServerRequest request) {
		retrieve(request);
	}


	@Get("/timeline/:id/data")
	@SecuredAction(value = "timelinegenerator.read", type = ActionType.RESOURCE)
	public void getTimelineData(HttpServerRequest request) {
		retrieve(request);
	}


	@Post("/timelines")
	@SecuredAction("timelinegenerator.create")
	public void createTimeline(final HttpServerRequest request) {
	    RequestUtils.bodyToJson(request, pathPrefix + "timeline", new Handler<JsonObject>() {
            @Override
            public void handle(JsonObject event) {
                create(request);
            }
        });
	}

	@Put("/timeline/:id")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void updateTimeline(final HttpServerRequest request) {
	    RequestUtils.bodyToJson(request, pathPrefix + "timeline", new Handler<JsonObject>() {
            @Override
            public void handle(JsonObject event) {
                update(request);
            }
        });
	}


	@Delete("/timeline/:id")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void deleteTimeline(HttpServerRequest request) {
		delete(request);
	}

	@Get("/timeline/:id/print")
	@SecuredAction(value = "timelinegenerator.read", type = ActionType.RESOURCE)
	public void print(HttpServerRequest request) {
		final String id = request.params().get("id");
		UserUtils.getUserInfos(eb, request, user -> {
			if (user != null) {
				timelineService.retrieve(id, user, eTimeline -> {
					if (eTimeline.isRight()) {
						eventService.list(id, user, eEvents -> {
							if (eEvents.isRight()) {
								final JsonObject timelineWithEvents =
										eTimeline.right().getValue().put("events", eEvents.right().getValue());
								if ("json".equals(request.params().get("format"))) {
									renderJson(request, timelineWithEvents);
								} else {
									renderView(request, timelineWithEvents, "print.html", null);
								}
							} else {
								leftToResponse(request, eEvents.left());
							}
						});
					} else {
						leftToResponse(request, eTimeline.left());
					}
				});
			} else {
				unauthorized(request, "invalid.user");
			}
		});
	}

	@Get("/publish")
	@SecuredAction("timelinegenerator.publish")
	public void publish(final HttpServerRequest request) {
		// This route is used to create publish Workflow right, nothing to do
		return;
	}

	@Get("/share/json/:id")
	@ApiDoc("Share timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void shareTimeline(final HttpServerRequest request) {
		shareJson(request, false);
	}

	@Put("/share/json/:id")
	@ApiDoc("Share timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void shareTimelineSubmit(final HttpServerRequest request) {
	    UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
            @Override
            public void handle(final UserInfos user) {
                if (user != null) {
                    final String id = request.params().get("id");
                    if (id == null || id.trim().isEmpty()) {
                        badRequest(request);
                        return;
                    }

                    JsonObject params = new JsonObject();
                    params.put("profilUri", "/userbook/annuaire#" + user.getUserId() + "#" + user.getType());
                    params.put("username", user.getUsername());
                    params.put("timelineUri", "/timelinegenerator#/view/" + id);
                    params.put("resourceUri", params.getString("timelineUri"));

                    shareJsonSubmit(request, "timelinegenerator.share", false, params, "headline");
                }
            }
        });
	}

	@Put("/share/remove/:id")
	@ApiDoc("Remove timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void removeShareTimeline(final HttpServerRequest request) {
		removeShare(request, false);
	}

	@Put("/share/resource/:id")
	@ApiDoc("Share timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void shareResource(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					final String id = request.params().get("id");
					if(id == null || id.trim().isEmpty()) {
						badRequest(request, "invalid.id");
						return;
					}

					JsonObject params = new JsonObject();
					params.put("profilUri", "/userbook/annuaire#" + user.getUserId() + "#" + user.getType());
					params.put("username", user.getUsername());
					params.put("timelineUri", "/timelinegenerator#/view/" + id);
					params.put("resourceUri", params.getString("timelineUri"));

                    JsonObject pushNotif = new JsonObject()
                            .put("title", "timeline.push-notif.title")
                            .put("body", I18n.getInstance()
                                    .translate("timelinegenerator.push-notif.body",
                                            getHost(request),
                                            I18n.acceptLanguage(request),
                                            user.getUsername()
                                    ));

                    params.put("pushNotif", pushNotif);

					shareResource(request, "timelinegenerator.share", false, params, "headline");
				}
			}
		});
	}

	private void cleanFolders(String id, UserInfos user, List<String> recipientIds){
		//owner style keep the reference to the ressource
		JsonArray jsonRecipients = new JsonArray(recipientIds).add(user.getUserId());
		JsonObject query = MongoQueryBuilder.build(QueryBuilder.start("ressourceIds").is(id).and("owner.userId").notIn(jsonRecipients));
		JsonObject update = new JsonObject().put("$pull", new JsonObject().put("ressourceIds", new JsonObject().put("$nin",jsonRecipients)));
		mongo.update("timelinegeneratorFolders", query, update, message -> {
			JsonObject body = message.body();
			if (!"ok".equals(body.getString("status"))) {
				String err = body.getString("error", body.getString("message", "unknown cleanFolder Error"));
				log.error("[cleanFolders] failed to clean folder because of: "+err);
			}
		});
	}

	public void doShareSucceed(HttpServerRequest request, String id, UserInfos user,JsonObject sharePayload, JsonObject result, boolean sendNotify){
		super.doShareSucceed(request, id, user, sharePayload, result, sendNotify);
		if(sharePayload!=null){
			Set<String> userIds = sharePayload.getJsonObject("users", new JsonObject()).getMap().keySet();
			Set<String> groupIds = sharePayload.getJsonObject("groups", new JsonObject()).getMap().keySet();
			UserUtils.getUserIdsForGroupIds(groupIds,user.getUserId(),this.eb, founded->{
				if(founded.succeeded()){
					List<String> userToKeep = new ArrayList<>(userIds);
					userToKeep.addAll(founded.result());
					cleanFolders(id, user, userToKeep);
				}else{
					log.error("[doShareSucceed] failed to found recipient because:",founded.cause());
				}
			});
		}
	}

	public void setTimelineService(TimelineService timelineService) {
		this.timelineService = timelineService;
	}

	public void setEventService(EventService eventService) {
		this.eventService = eventService;
	}

}
