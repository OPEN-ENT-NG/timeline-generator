package net.atos.entng.timelinegenerator.explorer;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import net.atos.entng.timelinegenerator.TimelineGenerator;
import org.entcore.common.explorer.ExplorerMessage;
import org.entcore.common.explorer.ExplorerPluginFactory;
import org.entcore.common.explorer.IExplorerPlugin;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.explorer.impl.ExplorerPluginResourceMongo;
import org.entcore.common.explorer.impl.ExplorerSubResource;
import org.entcore.common.share.ShareModel;
import org.entcore.common.share.ShareService;
import org.entcore.common.user.UserInfos;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class TimelineGeneratorExplorerPlugin extends ExplorerPluginResourceMongo {
    public static final String APPLICATION = TimelineGenerator.APPLICATION;
    public static final String TYPE = TimelineGenerator.TYPE;
    public static final String COLLECTION = TimelineGenerator.TIMELINE_GENERATOR_COLLECTION;

    private final Map<String, SecuredAction> securedActions;
    private final MongoClient mongoClient;
    private ShareService shareService;

    public static TimelineGeneratorExplorerPlugin create(final Map<String, SecuredAction> securedActions) throws Exception  {
        // Create the explorer plugin using mongo
        final IExplorerPlugin plugin = ExplorerPluginFactory.createMongoPlugin((params) ->
            new TimelineGeneratorExplorerPlugin(params.getCommunication(), params.getDb(), securedActions));
        return (TimelineGeneratorExplorerPlugin) plugin;
    }

    protected TimelineGeneratorExplorerPlugin(final IExplorerPluginCommunication communication, final MongoClient mongoClient, final Map<String, SecuredAction> securedActions) {
        super(communication, mongoClient);
        // Set the mongo client
        this.mongoClient = mongoClient;
        // Set the secured actions
        this.securedActions = securedActions;
    }

    public MongoClient getMongoClient() { return mongoClient; }

    public ShareService createShareService(final Map<String, List<String>> groupedActions) {
        this.shareService = createMongoShareService(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, securedActions, groupedActions);
        return this.shareService;
    }

    @Override
    protected Optional<ShareService> getShareService() {
        return Optional.ofNullable(shareService);
    }

    @Override
    protected String getApplication() { return APPLICATION; }

    @Override
    protected String getResourceType() { return TYPE; }

    @Override
    protected Future<ExplorerMessage> doToMessage(final ExplorerMessage message, final JsonObject source) {
        // Get the creator id
        final Optional<String> creatorId = getCreatorForModel(source).map(UserInfos::getUserId);
        // Set the name, description and thumbnail
        message.withName(source.getString("headline", ""));
        message.withDescription(source.getString("text", ""));
        message.withThumbnail(source.getString("icon"));
        // Timeline does not have content
        message.withContent("", ExplorerMessage.ExplorerContentType.Text);
        // Timeline are not public
        message.withPublic(false);
        // Set the trashed status
        final Object trashedValue = source.getValue("trashed", false);
        if (trashedValue instanceof Boolean) {
            message.withTrashed((Boolean) trashedValue);
        } else if (trashedValue instanceof Number) {
            message.withTrashed(((Number) trashedValue).intValue() > 0);
        }
        // "shared" only has meaning if it was explicitly set, otherwise it will reset the resources' shares
        if(source.containsKey("shared")) {
            // Create the normalized share model
            final ShareModel shareModel = new ShareModel(source.getJsonArray("shared", new JsonArray()), securedActions, creatorId);
            message.withShared(shareModel);
        }
        // Set the updated date
        final Object modified = source.getValue("modified");
        if (modified instanceof JsonObject) {
            message.withUpdatedAt(MongoDb.parseIsoDate((JsonObject) modified));
        }
        return Future.succeededFuture(message);
    }

    @Override
    public Map<String, SecuredAction> getSecuredActions() { return securedActions; }

    @Override
    protected String getCollectionName() { return COLLECTION; }

    @Override
    protected List<ExplorerSubResource> getSubResourcesPlugin() { return Collections.EMPTY_LIST; }

    @Override
    public Optional<UserInfos> getCreatorForModel(final JsonObject json) {
        // If the owner is not present or does not have a userId, return empty
        if(!json.containsKey("owner") || !json.getJsonObject("owner").containsKey("userId")){
            return Optional.empty();
        }
        // Get the owner
        final JsonObject owner = json.getJsonObject("owner");
        // Create the user infos
        final UserInfos user = new UserInfos();
        // Set the user id
        user.setUserId( owner.getString("userId"));
        // Set the username
        user.setUsername(owner.getString("displayName"));
        return Optional.ofNullable(user);
    }
}
