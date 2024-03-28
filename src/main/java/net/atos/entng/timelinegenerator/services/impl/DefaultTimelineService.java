package net.atos.entng.timelinegenerator.services.impl;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.Utils;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import net.atos.entng.timelinegenerator.TimelineGenerator;
import net.atos.entng.timelinegenerator.explorer.TimelineGeneratorExplorerPlugin;
import net.atos.entng.timelinegenerator.services.TimelineService;
import org.entcore.common.explorer.IngestJobState;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.entcore.common.user.UserInfos;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static java.lang.System.currentTimeMillis;

public class DefaultTimelineService extends MongoDbCrudService implements TimelineService {

	protected static final Logger log = LoggerFactory.getLogger(DefaultTimelineService.class);
	private TimelineGeneratorExplorerPlugin plugin;

	List<String> UPDATABLE_FIELDS = Arrays.asList("title", "content", "icon", "text", "trashed");
	public DefaultTimelineService(TimelineGeneratorExplorerPlugin plugin) {

		super(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION);
		this.plugin = plugin;
	}

	@Override
	public void create(JsonObject data, UserInfos user, Handler<Either<String, JsonObject>> result) {

		final long version = currentTimeMillis();

		if(validationError(result, data)) {
			return;
		}

		// title has to be added manually since there is a check at controller level
		// that doesn't accept "title" in the request, so we need to added statically, ideally
		// title should be added at the plugin level when the resource is created in DB.
		data.put("title", data.getValue("headline"));

		// object "owner" has to be created and is not passed in the request, for the moment we are creting
		// it here however it should be automatically created in the plugin explorer leve.
		setUserMetadata(data, user.getUserId(), user.getUsername());

		plugin.setIngestJobStateAndVersion(data, IngestJobState.TO_BE_SENT, version);
		plugin.create(user,data,false).onComplete(e -> {
			if(e.succeeded()) {
				result.handle(new Either.Right<String,JsonObject>(data.put("_id", e.result())));
			} else {
				result.handle(new Either.Left<String,JsonObject>(e.cause().getMessage()));
				log.error("Failed to create timeline post");
			}
		});
	}

	@Override
	public void update(final String id, JsonObject data, UserInfos user, Handler<Either<String, JsonObject>> handler) {
		final long version = currentTimeMillis();
		data.put("modified", MongoDb.now());

		// why do we need the validation of the field, isn't every field valid for modification?
		JsonObject validJsonObject = Utils.validAndGet(data, UPDATABLE_FIELDS, Collections.<String>emptyList());
		if(validationError(handler, validJsonObject)){return;}

		plugin.setIngestJobStateAndVersion(validJsonObject, IngestJobState.TO_BE_SENT, version);
		super.update(id, validJsonObject, handlerResponse -> {
			if(handlerResponse.isLeft()) {
				log.error("Failed to create timeline ", handlerResponse.left());
			} else {
				validJsonObject.put("_id", id);
				validJsonObject.put("updateAt", currentTimeMillis());
				plugin.setVersion(validJsonObject, version);
				plugin.notifyUpsert(user, validJsonObject).onSuccess((result) -> {
					handler.handle(new Either.Right<>(data));
				})
				.onFailure(error -> {
					log.error("Failed to update timeline: ", error);
					handler.handle(new Either.Left<>(error.getMessage()));
				});
			}
		});

	}

	// This was already commented, i dont know why it is left, to remove?
	// @Override
	// public void update(String id, JsonObject data, Handler<Either<String, JsonObject>> handler) {
	// 	final long version = currentTimeMillis();
	// 	super.update(id, data, handler);
	// 	JsonObject b = Utils.validAndGet(blog, UPDATABLE_FIELDS, Collections.<String>emptyList());

	// }

	private boolean validationError(Handler<Either<String, JsonObject>> result, JsonObject b) {
		if (b == null) {
			result.handle(new Either.Left<String, JsonObject>("Validation error : invalids fields."));
			return true;
		}
		return false;
	}
}
