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

package net.atos.entng.timelinegenerator;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.model.Filters;
import fr.wseduc.mongodb.MongoDbAPI;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import fr.wseduc.webutils.Either;
import io.vertx.core.*;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.bson.conversions.Bson;
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbRepositoryEvents;

import java.io.File;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

public class TimelineGeneratorRepositoryEvents extends MongoDbRepositoryEvents {

    public TimelineGeneratorRepositoryEvents(Vertx vertx) {
        super(vertx);

        this.collectionNameToImportPrefixMap.put(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, "timeline_");
        this.collectionNameToImportPrefixMap.put(TimelineGenerator.TIMELINE_GENERATOR_EVENT_COLLECTION, "event_");
    }

    protected void exportFiles(final JsonArray results, String exportPath, Set<String> usedFileName,
                               final AtomicBoolean exported, final Handler<Boolean> handler) {
        if (results.isEmpty()) {
            exported.set(true);
            log.info(title + " exported successfully to : " + exportPath);
            handler.handle(exported.get());
        } else {
            JsonObject resources = results.getJsonObject(0);
            String fileId = resources.getString("_id");
            String fileName = resources.getString("headline");
            if (fileName != null && fileName.contains("/")) {
                fileName = fileName.replaceAll("/", "-");
            }
            if (!usedFileName.add(fileName)) {
                fileName += "_" + fileId;
            }
            final String filePath = exportPath + File.separator + fileName;
            vertx.fileSystem().writeFile(filePath, resources.toBuffer(), new Handler<AsyncResult<Void>>() {
                @Override
                public void handle(AsyncResult<Void> event) {
                    if (event.succeeded()) {
                        results.remove(0);
                        exportFiles(results, exportPath, usedFileName, exported, handler);
                    } else {
                        log.error(title + " : Could not write file " + filePath, event.cause());
                        handler.handle(exported.get());
                    }
                }
            });
        }
    }

    @Override
    public void exportResources(JsonArray resourcesIds, boolean exportDocuments, boolean exportSharedResources, String exportId, String userId,
                                JsonArray groups, String exportPath, String locale, String host, Handler<Boolean> handler) {

        Bson findByAuthor = Filters.eq("owner.userId", userId);
        Bson findByShared = Filters.or(
                Filters.eq("shared.userId", userId),
                Filters.in("shared.groupId", groups));
        Bson findByAuthorOrShared = exportSharedResources == false ? findByAuthor : Filters.or(findByAuthor, findByShared);

        JsonObject query;

        if(resourcesIds == null)
            query = MongoQueryBuilder.build(findByAuthorOrShared);
        else {
            Bson limitToResources = Filters.and(findByAuthorOrShared,
                    Filters.in("_id", resourcesIds));
            query = MongoQueryBuilder.build(limitToResources);
        }

        final AtomicBoolean exported = new AtomicBoolean(false);

        Map<String, String> prefixMap = this.collectionNameToImportPrefixMap;

        mongo.find(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, query, new Handler<Message<JsonObject>>() {
            @Override
            public void handle(Message<JsonObject> event) {
                JsonArray results = event.body().getJsonArray("results");
                if ("ok".equals(event.body().getString("status")) && results != null) {
                    results.forEach(elem -> {
                        JsonObject timeline = ((JsonObject) elem);
                        timeline.put("headline", prefixMap.get(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION) + timeline.getString("headline"));
                    });

                    final Set<String> ids = results.stream().map(res -> ((JsonObject)res).getString("_id")).collect(Collectors.toSet());
                    Bson findByTimelineId = Filters.in("timeline", ids);
                    JsonObject query2 = MongoQueryBuilder.build(findByTimelineId);

                    mongo.find(TimelineGenerator.TIMELINE_GENERATOR_EVENT_COLLECTION, query2, new Handler<Message<JsonObject>>() {
                        @Override
                        public void handle(Message<JsonObject> event2) {
                            JsonArray results2 = event2.body().getJsonArray("results");
                            if ("ok".equals(event2.body().getString("status")) && results2 != null) {
                                results2.forEach(elem ->
                                {
                                    JsonObject event = ((JsonObject) elem);
                                    event.put("headline", prefixMap.get(TimelineGenerator.TIMELINE_GENERATOR_EVENT_COLLECTION) + event.getString("headline"));
                                });

                                createExportDirectory(exportPath, locale, new Handler<String>() {
                                    @Override
                                    public void handle(String path) {
                                        if (path != null) {
                                            Handler<Boolean> finish = new Handler<Boolean>() {
                                                @Override
                                                public void handle(Boolean bool) {
                                                    exportFiles(results, path, new HashSet<String>(), exported, handler);
                                                }
                                            };

                                            if(exportDocuments == true)
                                                exportDocumentsDependancies(results.addAll(results2), path, finish);
                                            else
                                                finish.handle(Boolean.TRUE);
                                        }
                                        else {
                                            handler.handle(exported.get());
                                        }
                                    }
                                });
                            }
                            else {
                                log.error("Blog : Could not proceed query " + query2.encode(), event2.body().getString("message"));
                                handler.handle(exported.get());
                            }
                        }
                    });
                }
                else {
                    log.error("Blog : Could not proceed query " + query.encode(), event.body().getString("message"));
                    handler.handle(exported.get());
                }
            }
        });
    }

    @Override
    public void deleteGroups(JsonArray groups, final Handler<List<ResourceChanges>> handler) {
        if(groups == null) {
            log.warn("[TimelineGeneratorRepositoryEvents][deleteGroups] JsonArray groups is null or empty");
            handler.handle(new ArrayList<>());
            return;
        }

        for(int i = groups.size(); i-- > 0;) {
            if(groups.hasNull(i))
                groups.remove(i);
            else if (groups.getJsonObject(i) != null && groups.getJsonObject(i).getString("group") == null)
                groups.remove(i);
        }
        if(groups.size() == 0) {
            log.warn("[TimelineGeneratorRepositoryEvents][deleteGroups] JsonArray groups is null or empty");
            handler.handle(new ArrayList<>());
            return;
        }

        final String[] groupIds = new String[groups.size()];
        for (int i = 0; i < groups.size(); i++) {
            JsonObject j = groups.getJsonObject(i);
            groupIds[i] = j.getString("group");
        }

        final JsonObject matcher = MongoQueryBuilder.build(Filters.in("shared.groupId", groupIds));

        MongoUpdateBuilder modifier = new MongoUpdateBuilder();
        modifier.pull("shared", MongoQueryBuilder.build(Filters.in("groupId", groupIds)));
        // remove all the shares with groups
        mongo.update(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, matcher, modifier.build(), false, true, MongoDbResult.validActionResultHandler(new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> event) {
                if (event.isRight()) {
                    log.info("[TimelineGeneratorRepositoryEvents][deleteGroups] All groups shares are removed");
                    handler.handle(new ArrayList<>());
                } else {
                    log.error("[TimelineGeneratorRepositoryEvents][deleteGroups] Error removing groups shares. Message : " + event.left().getValue());
                    handler.handle(new ArrayList<>());
                }
            }
        }));
    }

    @Override
    public void deleteUsers(JsonArray users, final Handler<List<ResourceChanges>> handler) {
        // FIXME: anonymization is not relevant
        if (users == null) {
            log.warn("[TimelineGeneratorRepositoryEvents][deleteUsers] JsonArray users is null or empty");
            handler.handle(new ArrayList<>());
            return;
        }
        for(int i = users.size(); i-- > 0;) {
            if(users.hasNull(i))
                users.remove(i);
            else if (users.getJsonObject(i) != null && users.getJsonObject(i).getString("id") == null)
                users.remove(i);
        }
        if(users.size() == 0) {
            log.warn("[TimelineGeneratorRepositoryEvents][deleteUsers] JsonArray users is null or empty");
            handler.handle(new ArrayList<>());
            return;
        }

        final String[] usersIds = new String[users.size()];
        for (int i = 0; i < users.size(); i++) {
            JsonObject j = users.getJsonObject(i);
            usersIds[i] = j.getString("id");
        }
        /*
         * Clean the database : - First, remove shares of all the categories shared with (usersIds) - then, get the
         * categories identifiers that have no user and no manger, - delete all these categories, - delete all the
         * subjects that do not belong to a category - finally, tag all users as deleted in their own categories
         */

        final List<ResourceChanges> resourceChanges = new ArrayList<>();
        
        this.removeSharesTimelinesWithHandler(usersIds, resourceChanges, handler);
    }

    /**
     * Remove the shares of timelines with a list of users, and notify handler when complete
     * @param usersIds users identifiers
     * @param resourceChanges list to collect resource changes
     * @param handler callback to notify when process is complete
     */
    private void removeSharesTimelinesWithHandler(final String[] usersIds, final List<ResourceChanges> resourceChanges, final Handler<List<ResourceChanges>> handler) {
        final JsonObject criteria = MongoQueryBuilder.build(Filters.in("shared.userId", usersIds));
        MongoUpdateBuilder modifier = new MongoUpdateBuilder();
        modifier.pull("shared", MongoQueryBuilder.build(Filters.in("userId", usersIds)));

        // Remove timelines shares with these users
        mongo.update(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, criteria, modifier.build(), false, true, MongoDbResult.validActionResultHandler(new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> event) {
                if (event.isRight()) {
                    log.info("[TimelineGeneratorRepositoryEvents][removeSharesTimelines] All timelines shares with users are removed");
                    
                    // First tag users as deleted in their own timelines
                    tagUsersAsDeleted(usersIds)
                        .onSuccess(success -> {
                            // Then prepare cleaning timelines with no owner/manager
                            prepareCleanTimelinesWithHandler(usersIds, resourceChanges, handler);
                        })
                        .onFailure(err -> {
                            log.error("[TimelineGeneratorRepositoryEvents][removeSharesTimelines] Error tagging users as deleted: " + err.getMessage());
                            handler.handle(resourceChanges);
                        });
                } else {
                    log.error("[TimelineGeneratorRepositoryEvents][removeSharesTimelines] Error removing timelines shares with users. Message : " + event.left().getValue());
                    handler.handle(resourceChanges);
                }
            }
        }));
    }

    /**
     * Prepare a list of categories identifiers if OK, Call cleanCategories() with handler
     * @param usersIds users identifiers
     * @param resourceChanges list to collect resource changes
     * @param handler callback to notify when process is complete
     */
    private void prepareCleanTimelinesWithHandler(final String[] usersIds, final List<ResourceChanges> resourceChanges, final Handler<List<ResourceChanges>> handler) {
        // users currently deleted
        Bson deletedUsers = Filters.in("owner.userId", usersIds);
        // users who have already been deleted
        Bson ownerIsDeleted = Filters.eq("owner.deleted", true);
        // no manager found
        JsonObject matcher = MongoQueryBuilder.build(Filters.and(Filters.ne("shared." + TimelineGenerator.MANAGE_RIGHT_ACTION, true), Filters.or(deletedUsers, ownerIsDeleted)));
        // return only calendar identifiers
        JsonObject projection = new JsonObject().put("_id", 1);

        mongo.find(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, matcher, null, projection, MongoDbResult.validResultsHandler(new Handler<Either<String, JsonArray>>() {
            @Override
            public void handle(Either<String, JsonArray> event) {
                if (event.isRight()) {
                    JsonArray timelines = event.right().getValue();
                    if (timelines == null || timelines.size() == 0) {
                        log.info("[TimelineGeneratorRepositoryEvents][prepareCleanTimelines] No timelines to delete");
                        handler.handle(resourceChanges);
                        return;
                    }
                    final String[] timelineIds = new String[timelines.size()];
                    for (int i = 0; i < timelines.size(); i++) {
                        JsonObject j = timelines.getJsonObject(i);
                        timelineIds[i] = j.getString("_id");
                        resourceChanges.add(new ResourceChanges(j.getString("_id"), true));
                    }
                    cleanTimelinesWithHandler(usersIds, timelineIds, resourceChanges, handler);
                } else {
                    log.error("[TimelineGeneratorRepositoryEvents][prepareCleanTimelines] Error retrieving the timelines created by users. Message : " + event.left().getValue());
                    handler.handle(resourceChanges);
                }
            }
        }));
    }

    /**
     * Delete timelines by identifier if OK, call cleanEvents() with handler
     * @param usersIds users identifiers, used for tagUsersAsDeleted()
     * @param timelineIds timelines identifiers
     * @param resourceChanges list to collect resource changes
     * @param handler callback to notify when process is complete
     */
    private void cleanTimelinesWithHandler(final String[] usersIds, final String[] timelineIds, final List<ResourceChanges> resourceChanges, final Handler<List<ResourceChanges>> handler) {
        JsonObject matcher = MongoQueryBuilder.build(Filters.in("_id", timelineIds));

        mongo.delete(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, matcher, MongoDbResult.validActionResultHandler(new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> event) {
                if (event.isRight()) {
                    log.info("[TimelineGeneratorRepositoryEvents][cleanTimelines] The timelines created by users are deleted");
                    cleanEventsWithHandler(timelineIds, resourceChanges, handler);
                } else {
                    log.error("[TimelineGeneratorRepositoryEvents][cleanTimelines] Error deleting the timelines created by users. Message : " + event.left().getValue());
                    handler.handle(resourceChanges);
                }
            }
        }));
    }

    /**
     * Delete events by timeline identifier and notify handler when complete
     * @param timelineIds timeline identifiers
     * @param resourceChanges list to collect resource changes
     * @param handler callback to notify when process is complete
     */
    private void cleanEventsWithHandler(final String[] timelineIds, final List<ResourceChanges> resourceChanges, final Handler<List<ResourceChanges>> handler) {
        JsonObject matcher = MongoQueryBuilder.build(Filters.in("timeline", timelineIds));

        mongo.delete(TimelineGenerator.TIMELINE_GENERATOR_EVENT_COLLECTION, matcher, MongoDbResult.validActionResultHandler(new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> event) {
                if (event.isRight()) {
                    log.info("[TimelineGeneratorRepositoryEvents][cleanEvents] The events created by users are deleted");
                } else {
                    log.error("[TimelineGeneratorRepositoryEvents][cleanEvents] Error deleting the events created by users. Message : " + event.left().getValue());
                }
                handler.handle(resourceChanges);
            }
        }));
    }

    /**
     * Tag as deleted a list of users in their own timelines
     * @param usersIds users identifiers
     * @return Future with success status
     */
    private Future<Boolean> tagUsersAsDeleted(final String[] usersIds) {
        final Promise<Boolean> promise = Promise.promise();
        final JsonObject criteria = MongoQueryBuilder.build(Filters.in("owner.userId", usersIds));
        MongoUpdateBuilder modifier = new MongoUpdateBuilder();
        modifier.set("owner.deleted", true);

        mongo.update(TimelineGenerator.TIMELINE_GENERATOR_COLLECTION, criteria, modifier.build(), false, true, MongoDbAPI.WriteConcern.MAJORITY, MongoDbResult.validActionResultHandler(new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> event) {
                if (event.isRight()) {
                    log.info("[TimelineGeneratorRepositoryEvents][tagUsersAsDeleted] users are tagged as deleted in their own timelines");
                    promise.complete(true);
                } else {
                    log.error("[TimelineGeneratorRepositoryEvents][tagUsersAsDeleted] Error tagging as deleted users. Message : " + event.left().getValue());
                    promise.fail(event.left().getValue());
                }
            }
        }));
    
        return promise.future();
    }
}
