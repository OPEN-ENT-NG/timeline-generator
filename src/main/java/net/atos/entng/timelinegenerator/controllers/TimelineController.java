package net.atos.entng.timelinegenerator.controllers;

import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.service.CrudService;
import org.vertx.java.core.http.HttpServerRequest;

import fr.wseduc.rs.ApiDoc;
import fr.wseduc.rs.Delete;
import fr.wseduc.rs.Get;
import fr.wseduc.rs.Post;
import fr.wseduc.rs.Put;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;


public class TimelineController extends MongoDbControllerHelper {
	
	public TimelineController(String collection, CrudService timelineService) {
		super(collection);
		this.crudService = timelineService;
	}

	@Get("")
	@SecuredAction("timelinegenerator.view")
	public void view(HttpServerRequest request) {
		renderView(request);
	}
	
	@Get("/timelines")
	@SecuredAction("timelinegenerator.list")
	public void listCategories(HttpServerRequest request) {
		list(request);
	}
	
	@Get("/timeline/:id")
	@SecuredAction(value = "timelinegenerator.read", type = ActionType.RESOURCE)
	public void getTimeline(HttpServerRequest request) {
		retrieve(request);
	}
	

	@Post("/timelines")
	@SecuredAction("timelinegenerator.create")
	public void createTimeline(HttpServerRequest request) {
		create(request);
	}
	
	@Put("/timeline/:id")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void updateTimeline(HttpServerRequest request) {
		update(request);
	}
	
	@Delete("/timeline/:id")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void deleteTimeline(HttpServerRequest request) {
		delete(request);
	}

	@Get("/share/json/:id")
	@ApiDoc("Share timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void shareCategory(final HttpServerRequest request) {
		shareJson(request);
	}

	@Put("/share/json/:id")
	@ApiDoc("Share timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void shareCategorySubmit(final HttpServerRequest request) {
		shareJsonSubmit(request, "notify-timeline-shared.html");
	}

	@Put("/share/remove/:id")
	@ApiDoc("Remove timeline by id.")
	@SecuredAction(value = "timelinegenerator.manager", type = ActionType.RESOURCE)
	public void removeShareCategory(final HttpServerRequest request) {
		removeShare(request);
	}

}
