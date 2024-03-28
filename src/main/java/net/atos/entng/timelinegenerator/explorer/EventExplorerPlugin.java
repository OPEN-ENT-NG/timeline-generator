package net.atos.entng.timelinegenerator.explorer;

import java.util.Collection;

import org.entcore.common.explorer.ExplorerMessage;
import org.entcore.common.explorer.impl.ExplorerSubResourceMongo;

import com.mongodb.QueryBuilder;

import fr.wseduc.mongodb.MongoQueryBuilder;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.mongo.MongoClientDeleteResult;
import net.atos.entng.timelinegenerator.TimelineGenerator;

public class EventExplorerPlugin  extends ExplorerSubResourceMongo{

    public static final String COLLECTION = TimelineGenerator.TIMELINE_GENERATOR_EVENT_COLLECTION;
    public static final String TYPE = TimelineGenerator.TIMELINE_GENERATOR_EVENT_TYPE;

    static Logger log = LoggerFactory.getLogger(EventExplorerPlugin.class);

    public EventExplorerPlugin(final TimelineGeneratorExplorerPlugin plugin) {
        super(plugin, plugin.getMongoClient());
    }

    @Override
    public Future<Void> onDeleteParent(final Collection<String> ids) {
        if(ids.isEmpty()) {
            return Future.succeededFuture();
        } 
        final MongoClient mongo = ((TimelineGeneratorExplorerPlugin)super.parent).getMongoClient();
        final JsonObject filter = MongoQueryBuilder.build(QueryBuilder.start("timelinegenerator.$id").in(ids));
        final Promise<MongoClientDeleteResult> promise = Promise.promise();
        log.info("Deleting post related to deleted timeline generator. Number of timeline generator="+ids.size());
        mongo.removeDocuments(COLLECTION, filter, promise);
        return promise.future().map(e->{
            log.info("Deleted post related to deleted timeline generator. Number of posts="+e.getRemovedCount());
            return null;
        });
    }

    @Override
    protected String getCollectionName() {
        return COLLECTION;
    }

    @Override
    protected String getParentColumn() {
        return "timelinegenerator.$id";
    }

    @Override
    protected Future<ExplorerMessage> doToMessage(final ExplorerMessage message, final JsonObject source) {
        final String id = source.getString("_id");
        message.withVersion(System.currentTimeMillis());
        message.withSubResourceHtml(id, source.getString("content",""), source.getLong("version", 0L));
        return Future.succeededFuture(message);
    }

    @Override
    public String getEntityType() {
       return TimelineGenerator.TIMELINE_GENERATOR_EVENT_TYPE;
    }

    @Override
    protected String getParentId(JsonObject jsonObject) {
        final JsonObject timelineGeneratorRef = jsonObject.getJsonObject("timelinegenerator");
        return timelineGeneratorRef.getString("$id");
    }

}
