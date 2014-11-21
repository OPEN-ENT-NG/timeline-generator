package net.atos.entng.timelinegenerator.controllers;

import net.atos.entng.timelinegenerator.helpers.EventHelper;

import org.entcore.common.service.CrudService;
import org.vertx.java.core.http.HttpServerRequest;

import fr.wseduc.rs.Delete;
import fr.wseduc.rs.Get;
import fr.wseduc.rs.Post;
import fr.wseduc.rs.Put;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.http.BaseController;

public class EventController extends BaseController {

	private final EventHelper eventHelper;
	
	public EventController(String collection, CrudService eventService) {
		eventHelper = new EventHelper(collection, eventService);
	}
	
	@Get("/timeline/:id/events")
	@SecuredAction(value = "timelinegenerator.read", type = ActionType.RESOURCE)
	public void getEvents(HttpServerRequest request) {
		eventHelper.list(request);
	}
	
	@Post("/timeline/:id/events")
	@SecuredAction(value = "timelinegenerator.contrib", type = ActionType.RESOURCE)
	public void createEvent(HttpServerRequest request) {
		eventHelper.create(request);
	}
	
	@Get("/timeline/:id/event/:eventid")
	@SecuredAction(value = "timelinegenerator.read", type = ActionType.RESOURCE)
	public void getEvent(HttpServerRequest request) {
		eventHelper.retrieve(request);
	}
	
	@Put("/timeline/:id/event/:eventid")
	@SecuredAction(value = "timelinegenerator.contrib", type = ActionType.RESOURCE)
	public void updateEvent(HttpServerRequest request) {
		eventHelper.update(request);
	}
	
	@Delete("/timeline/:id/event/:eventid")
	@SecuredAction(value = "timelinegenerator.contrib", type = ActionType.RESOURCE)
	public void deleteEvent(HttpServerRequest request) {
		eventHelper.delete(request);
	}
}
