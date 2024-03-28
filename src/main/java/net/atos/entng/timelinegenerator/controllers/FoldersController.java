package net.atos.entng.timelinegenerator.controllers;

import java.util.Map;

import org.apache.commons.lang3.math.NumberUtils;
import org.entcore.common.explorer.to.FolderResponse;
import org.entcore.common.explorer.to.FolderUpsertRequest;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.UserUtils;
import org.vertx.java.core.http.RouteMatcher;

import fr.wseduc.rs.ApiDoc;
import fr.wseduc.rs.Delete;
import fr.wseduc.rs.Get;
import fr.wseduc.rs.Post;
import fr.wseduc.rs.Put;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import net.atos.entng.timelinegenerator.TimelineGenerator;
import net.atos.entng.timelinegenerator.explorer.TimelineGeneratorExplorerPlugin;
import net.atos.entng.timelinegenerator.security.FolderOwner;

public class FoldersController extends MongoDbControllerHelper {

	private final Vertx vertx;
	private final TimelineGeneratorExplorerPlugin plugin;

	public FoldersController(String collectionName, final Vertx vertx,final TimelineGeneratorExplorerPlugin plugin) {
		super(collectionName);
		this.plugin = plugin;
		this.vertx = vertx;
	}

	@Override
	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
					 Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super.init(vertx, config, rm, securedActions);
	}

	@Override
	@Get("folder/list/:filter")
	@ApiDoc("List all user folders.")
	@SecuredAction(value = "", type = ActionType.AUTHENTICATED)
	public void list(HttpServerRequest request) {
		super.list(request);
	}

	@Post("folder")
	@ApiDoc("Add folder.")
	@SecuredAction("timelinegenerator.folders.add")
	public void add(HttpServerRequest request) {
		RequestUtils.bodyToJson(request, data -> {
			UserUtils.getAuthenticatedUserInfos(this.vertx.eventBus(), request).onSuccess(user -> {
				final Object parentId = data.getValue("parentId");
				final String name = data.getString("name");
				final long safeParentId = parentId != null ? NumberUtils.toLong(parentId.toString()) : null;
				plugin.upsertFolder(user, new FolderUpsertRequest(user, safeParentId, TimelineGenerator.APPLICATION, name))
				.onComplete(result -> {
					if(result.succeeded()) {
						// Renders.renderJson(request, result.result());
						Renders.renderJson(request, this.adapt(result.result()));
					} else {
						Renders.renderError(request, new JsonObject().put("error", result.cause().getMessage()));
					}
				});
			});
		});
		create(request);
	}

	@Override
	@Put("folder/:id")
	@ApiDoc("Update folder by id.")
	@ResourceFilter(FolderOwner.class)
	public void update(HttpServerRequest request) {
		super.update(request);
	}

	@Override
	@Delete("folder/:id")
	@ApiDoc("Delete folder by id.")
	@ResourceFilter(FolderOwner.class)
	public void delete(HttpServerRequest request) {
		super.delete(request);
	}
	
	private JsonObject adapt(final FolderResponse response){
		final JsonObject owner = new JsonObject().put("userId",response.getOwnerUserId()).put("displayName", response.getOwnerUserName());
		final JsonObject folder = new JsonObject();
		folder.put("created", new JsonObject().put("$date", response.getCreated()));
		folder.put("modified", new JsonObject().put("$date", response.getModified()));
		folder.put("name", response.getName());
		folder.put("owner", owner);
		folder.put("ressourceIds",new JsonArray(response.getEntResourceIds()));
		folder.put("id", response.getId());
		folder.put("_id", response.getId().toString());
		folder.put("trashed", response.getTrashed());
		if(response.getParentId() != null){
			folder.put("parentId", response.getParentId().toString());
		}else{
			folder.put("parentId", "root");
		}
		return folder;
	}
}