package net.atos.entng.timelinegenerator.services;

import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;

public interface FolderService {

    void addFolder(HttpServerRequest request, Vertx vertx);

}
