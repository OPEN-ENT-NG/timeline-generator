package net.atos.entng.timelinegenerator.services.impl;

import net.atos.entng.timelinegenerator.services.TimelineService;

import org.entcore.common.service.impl.MongoDbCrudService;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;

public class TimelineServiceMongoImpl extends MongoDbCrudService implements TimelineService {

	public TimelineServiceMongoImpl(final String collection) {
		super(collection);
	}
	
	@Override
	public void list(UserInfos user, Handler<Either<String, JsonArray>> handler) {
		super.list(handler);
		
	}

	@Override
	public void create(JsonObject data, UserInfos user, Handler<Either<String, JsonObject>> handler) {
		super.create(data, user, handler);
	}
	
	@Override
	public void delete(String id, UserInfos user, Handler<Either<String, JsonObject>> handler) {
		super.delete(id, user, handler);
	}
	
	@Override
	public void update(String id, JsonObject data, UserInfos user, Handler<Either<String, JsonObject>> handler) {
		super.update(id, data, user, handler);
	}
	
	@Override
	public void retrieve(String id, UserInfos user, Handler<Either<String, JsonObject>> handler) {
		super.retrieve(id, user, handler);
	}
}
