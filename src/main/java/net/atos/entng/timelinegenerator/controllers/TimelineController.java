package net.atos.entng.timelinegenerator.controllers;

import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.rs.ApiDoc;
import fr.wseduc.rs.Delete;
import fr.wseduc.rs.Get;
import fr.wseduc.rs.Post;
import fr.wseduc.rs.Put;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.request.RequestUtils;


public class TimelineController extends MongoDbControllerHelper {
	
	public TimelineController(String collection) {
		super(collection);
	}

	@Get("")
	@SecuredAction("timelinegenerator.view")
	public void view(HttpServerRequest request) {
		renderView(request);
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
		shareJsonSubmit(request, "notify-timeline-shared.html", false);
	}

	@Put("/share/remove/:id")
	@ApiDoc("Remove timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void removeShareTimeline(final HttpServerRequest request) {
		removeShare(request, false);
	}

}
