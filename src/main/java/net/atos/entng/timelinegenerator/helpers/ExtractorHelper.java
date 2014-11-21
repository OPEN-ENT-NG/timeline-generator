package net.atos.entng.timelinegenerator.helpers;

import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.http.BaseController;
import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.RequestUtils;

public abstract class ExtractorHelper extends BaseController {

	protected void extractUserFromRequest(final HttpServerRequest request, final Handler<UserInfos> handler) {
		try {
			UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
				@Override
				public void handle(final UserInfos user) {
					if (user != null) {
						handler.handle(user);
					}
					else {
						log.error("Failed to extract User : User is null");
						Renders.badRequest(request, "User is null");
					}
				}
			});
		}
		catch (Exception e){
			log.error("Failed to extract User" + e.getMessage(), e);
			Renders.badRequest(request, e.getMessage());
		}
	}
	
	protected void extractBodyFromRequest(final HttpServerRequest request, final Handler<JsonObject> handler) {
		try {
			RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
				@Override
				public void handle(JsonObject object) {
					if (object != null) {
						handler.handle(object);
					}
					else {
						log.error("Failed to extract Request body : body is null");
						Renders.badRequest(request, "Request body is null");
					}
				}
			});
		}
		catch (Exception e) {
			log.error("Failed to extract Request body" + e.getMessage(), e);
			Renders.badRequest(request, e.getMessage());
		}
	}
	
	protected String extractParameter(final HttpServerRequest request, final String parameterKey) {
		try {
			return request.params().get(parameterKey);
		}
		catch (Exception e) {
			log.error("Failed to extract parameter [ " + parameterKey + " : " + e.getMessage());
			Renders.badRequest(request, e.getMessage());
			return null;
		}
	}
	
	protected void renderErrorException(final HttpServerRequest request, final Exception e) {
		log.error(e.getMessage(), e);
		
		JsonObject error = new JsonObject();
		error.putString("class", e.getClass().getName());
		if (e.getMessage() != null) {
			error.putString("message", e.getMessage());
		}
		Renders.renderError(request, error);
	}	
}
