package net.atos.entng.timelinegenerator.listeners;

import io.vertx.core.json.JsonObject;
import org.entcore.broker.api.dto.resources.ResourceInfoDTO;
import org.entcore.broker.proxy.ResourceBrokerListener;
import org.entcore.common.resources.MongoResourceBrokerListenerImpl;

import java.util.Date;

/**
 * Implementation of ResourceBrokerListener for the TimelineGenerator module.
 * Retrieves resource information from the timelinegenerator collection.
 * Implements ResourceBrokerListener to detect Broker annotations.
 */
public class ResourceBrokerListenerImpl extends MongoResourceBrokerListenerImpl implements ResourceBrokerListener {

    /**
     * Name of the MongoDB collection containing timeline data
     */
    private static final String TIMELINE_COLLECTION = "timelinegenerator";

    /**
     * Create a new MongoDB implementation of ResourceBrokerListener for timelines.
     */
    public ResourceBrokerListenerImpl() {
        super(TIMELINE_COLLECTION);
    }
    
    /**
     * Convert MongoDB timeline document to ResourceInfoDTO.
     * Overrides parent method to match the specific document structure in timelinegenerator.
     *
     * @param resource The MongoDB document from timelinegenerator collection
     * @return ResourceInfoDTO with extracted information
     */
    @Override
    protected ResourceInfoDTO convertToResourceInfoDTO(JsonObject resource) {
        if (resource == null) {
            return null;
        }
        
        try {
            // Extract basic information
            final String id = resource.getString("_id");
            // Note: In timeline, the title is stored in the "headline" field
            final String title = resource.getString("headline", "");
            // Use textPlain for description (text contains HTML)
            final String description = resource.getString("textPlain", "");
            // Use icon as thumbnail
            final String thumbnail = resource.getString("icon", "");
            
            // Extract owner information from timeline-specific structure
            final JsonObject owner = resource.getJsonObject("owner", new JsonObject());
            final String authorId = owner.getString("userId", "");
            final String authorName = owner.getString("displayName", "");
            
            // Handle creation and modification dates
            Date creationDate = this.parseDate(resource.getValue("created", System.currentTimeMillis()));
            Date modificationDate = this.parseDate(resource.getValue("modified", System.currentTimeMillis()));
            
            return new ResourceInfoDTO(
                id,
                title,
                description,
                thumbnail,
                authorName,
                authorId,
                creationDate,
                modificationDate
            );
        } catch (Exception e) {
            log.error("Error converting Timeline document to ResourceInfoDTO", e);
            return null;
        }
    }
}