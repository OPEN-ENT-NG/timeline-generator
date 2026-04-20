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

package net.atos.entng.timelinegenerator.security;

import fr.wseduc.webutils.security.XSSUtils;
import io.vertx.core.json.JsonObject;

public final class EventSanitizer {

    private EventSanitizer() {}

    public static void sanitize(final JsonObject object) {
        if (object == null) return;
        // Force headline/text to be present so Mongo's $set cannot preserve a
        // previously-planted malicious value when RequestUtils.bodyToJson drops
        // a field via cross-field XSS pattern match.
        if (!object.containsKey("headline")) object.put("headline", "");
        if (!object.containsKey("text")) object.put("text", "");
        object.put("headline", XSSUtils.stripXSS(object.getString("headline", "")));
        object.put("text", XSSUtils.stripXSS(object.getString("text", "")));
    }
}