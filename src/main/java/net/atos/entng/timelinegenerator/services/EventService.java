/*
 * Copyright © Région Nord Pas de Calais-Picardie, 2016.
 *
 * This file is part of OPEN ENT NG. OPEN ENT NG is a versatile ENT Project based on the JVM and ENT Core Project.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation (version 3 of the License).
 *
 * For the sake of explanation, any module that communicate over native
 * Web protocols, such as HTTP, with OPEN ENT NG is outside the scope of this
 * license and could be license under its own terms. This is merely considered
 * normal use of OPEN ENT NG, and does not fall under the heading of "covered work".
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package net.atos.entng.timelinegenerator.services;

import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import fr.wseduc.webutils.Either;

public interface EventService {

	
	public void list(String timelineId, UserInfos user, Handler<Either<String, JsonArray>> handler);

	public void create(String timelineId, JsonObject body, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void retrieve(String timelineId, String eventId, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void update(String timelineId, String eventId, JsonObject body, UserInfos user, Handler<Either<String, JsonObject>> handler);
	
	public void delete(String timelineId, String eventId, UserInfos user, Handler<Either<String, JsonObject>> handler);

}
