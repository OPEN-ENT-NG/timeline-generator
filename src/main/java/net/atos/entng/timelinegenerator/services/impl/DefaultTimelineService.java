package net.atos.entng.timelinegenerator.services.impl;

import static java.lang.System.currentTimeMillis;

import java.util.ArrayList;
import java.util.List;

import org.entcore.common.explorer.IngestJobState;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.entcore.common.user.UserInfos;

import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.Utils;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import net.atos.entng.timelinegenerator.TimelineGenerator;
import net.atos.entng.timelinegenerator.enums.Fields;
import net.atos.entng.timelinegenerator.explorer.TimelineGeneratorExplorerPlugin;
import net.atos.entng.timelinegenerator.services.TimelineService;

public class DefaultTimelineService extends MongoDbCrudService implements TimelineService {

	protected static final Logger log = LoggerFactory.getLogger(DefaultTimelineService.class);
	private TimelineGeneratorExplorerPlugin plugin;

	public DefaultTimelineService(TimelineGeneratorExplorerPlugin plugin) {

		super(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION);
		this.plugin = plugin;
	}

	@Override
	public void create(JsonObject data, UserInfos user, Handler<Either<String, JsonObject>> result) {
		
		final long version = currentTimeMillis();
      	super.create(data, user, result);

		List<String> fields = new ArrayList<>(Fields.getAllFieldNames());
		JsonObject b = Utils.validAndGet(data, Fields.getAllFieldNames(), fields);

		if(validationError(result, b)) {
			return;
		}

		plugin.setIngestJobStateAndVersion(b, IngestJobState.TO_BE_SENT, version);

		plugin.create(user,b,false).onComplete(e -> {
			if(e.succeeded()) {
				result.handle(new Either.Right<String,JsonObject>(data.put("_id", e.result())));
			} else {
				result.handle(new Either.Left<String,JsonObject>(e.cause().getMessage()));
				log.error("Failed to create timeline post");
			}
		});
	}
//TODO Already commented
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
