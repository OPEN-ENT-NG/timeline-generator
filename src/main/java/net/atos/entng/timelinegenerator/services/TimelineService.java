package net.atos.entng.timelinegenerator.services;

import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;


public interface TimelineService {

	public void list(UserInfos user, Handler<Either<String, JsonArray>> handler);

	public void create(JsonObject body, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void retrieve(String timelineId, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void update(String timelineId, JsonObject body, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void delete(String timelineId, UserInfos user, Handler<Either<String, JsonObject>> handler);
}
