package net.atos.entng.timelinegenerator.explorer;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.entcore.common.explorer.ExplorerMessage;
import org.entcore.common.explorer.ExplorerPluginFactory;
import org.entcore.common.explorer.IExplorerPlugin;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.explorer.impl.ExplorerPluginResourceMongo;
import org.entcore.common.explorer.impl.ExplorerSubResource;
import org.entcore.common.share.ShareModel;
import org.entcore.common.share.ShareService;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import net.atos.entng.timelinegenerator.TimelineGenerator;

public class TimelineGeneratorExplorerPlugin extends ExplorerPluginResourceMongo {

    public static final String APPLICATION = TimelineGenerator.TIMELINE_GENERATOR_COLLECTION;
    public static final String COLLECTION = TimelineGenerator.TIMELINE_GENERATOR_COLLECTION;
    public static final String TYPE = TimelineGenerator.TIMELINE_GENERATOR_TYPE;


    private final TimelineGeneratorFolderPlugin folderPlugin;
    private final EventExplorerPlugin eventPlugin;
    private final MongoClient mongoClient;
    private final Map<String, SecuredAction> securedActions;
    private ShareService shareService;

    public TimelineGeneratorExplorerPlugin(final IExplorerPluginCommunication communication, final MongoClient mongoClient, final Map<String, SecuredAction> secureActions) {
        super(communication, mongoClient);
        this.mongoClient = mongoClient;
        this.securedActions = secureActions;

        this.folderPlugin = new TimelineGeneratorFolderPlugin(this);
        this.eventPlugin = new EventExplorerPlugin(this);
    }

    public static TimelineGeneratorExplorerPlugin create(final Map<String, SecuredAction> securedActions) throws Exception {
        final IExplorerPlugin plugin = ExplorerPluginFactory.createMongoPlugin((params)->{
            return new TimelineGeneratorExplorerPlugin(params.getCommunication(), params.getDb(), securedActions);
        });
        return (TimelineGeneratorExplorerPlugin) plugin;
    }

    public MongoClient getMongoClient() {return mongoClient;}


    @Override
    protected String getCollectionName() {
        return COLLECTION;
    }

    @Override
    protected Future<ExplorerMessage> doToMessage(final ExplorerMessage message, final JsonObject source) {
        final Optional<String> creatorId = getCreatorForModel(source).map(e -> e.getUserId());
        final JsonObject custom = new JsonObject().put("slug", source.getString("slug", ""));
        custom.put("publish-type", source.getString("publish-type", ""));
        message.withName(source.getString("title", ""));
        message.withContent(source.getString("description", ""), ExplorerMessage.ExplorerContentType.Html);
        message.withPublic("PUBLIC".equals(source.getString("visibility")));
        message.withTrashed(source.getBoolean("trashed", false));
        // "shared" only has meaning if it was explicitly set, otherwise it will reset the resources' shares
        if(source.containsKey("shared")) {
            final ShareModel shareModel = new ShareModel(source.getJsonArray("shared", new JsonArray()), securedActions, creatorId);
            message.withShared(shareModel);
        }
        message.withThumbnail(source.getString("thumbnail"));
        message.withDescription(source.getString("description"));
        message.withCustomFields(custom);
        // set updated date
        final Object modified = source.getValue("modified");
        if(modified != null && modified instanceof JsonObject){
            message.withUpdatedAt(MongoDb.parseIsoDate((JsonObject) modified));
        }
        return Future.succeededFuture(message);
    }

    @Override
    protected String getApplication() {
        return APPLICATION;
    }

    @Override
    protected String getResourceType() {
        return TYPE;
    }

    @Override
    protected Map<String, SecuredAction> getSecuredActions() {
        return securedActions;
    }

    @Override
    protected Optional<ShareService> getShareService() {
        return Optional.ofNullable(shareService); 
    }

    public ShareService createShareService(final Map<String, List<String>> groupedActions) {
        this.shareService = createMongoShareService(COLLECTION, securedActions, groupedActions);
        return this.shareService;
    }

    @Override
    protected List<ExplorerSubResource> getSubResourcesPlugin() {
        return Collections.singletonList(eventPlugin);
    }

}
