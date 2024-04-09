package net.atos.entng.timelinegenerator.services;

import org.entcore.common.user.UserInfos;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;


public interface TimelineService {

	void retrieve(String id, UserInfos user, Handler<Either<String, JsonObject>> handler);

	void create(JsonObject data, UserInfos user, Handler<Either<String, JsonObject>> result);

}
