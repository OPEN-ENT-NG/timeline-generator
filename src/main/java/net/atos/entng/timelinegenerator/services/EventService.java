package net.atos.entng.timelinegenerator.services;

import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;

public interface EventService {

	
	public void list(String timelineId, UserInfos user, Handler<Either<String, JsonArray>> handler);

	public void create(String timelineId, JsonObject body, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void retrieve(String timelineId, String eventId, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void update(String timelineId, String eventId, JsonObject body, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void delete(String timelineId, String eventId, UserInfos user, Handler<Either<String, JsonObject>> handler);

}
