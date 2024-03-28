package net.atos.entng.timelinegenerator.explorer;

import org.entcore.common.explorer.impl.ExplorerFolderTreeMongo;

import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

public class TimelineGeneratorFolderPlugin extends ExplorerFolderTreeMongo {

    public static final String COLLECTION = "timelineFolders";
    static Logger log = LoggerFactory.getLogger(TimelineGeneratorFolderPlugin.class);

    public TimelineGeneratorFolderPlugin(final TimelineGeneratorExplorerPlugin plugin) {
        super(plugin, plugin.getMongoClient());
    }

    @Override
    protected String getCollectionName() {
        return COLLECTION;
    }

}
