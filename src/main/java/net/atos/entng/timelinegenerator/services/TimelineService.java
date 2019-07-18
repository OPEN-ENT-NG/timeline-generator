package net.atos.entng.timelinegenerator.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import org.entcore.common.user.UserInfos;


public interface TimelineService {

	void retrieve(String id, UserInfos user, Handler<Either<String, JsonObject>> handler);

}
