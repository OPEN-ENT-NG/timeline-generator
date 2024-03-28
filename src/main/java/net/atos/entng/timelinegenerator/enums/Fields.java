package net.atos.entng.timelinegenerator.enums;

import java.util.Arrays;
import java.util.List;

public enum Fields {

    AUTHOR("author"),
    TITLE("title"),
    CONTENT("content"),
    BLOG("blog"),
    STATE("state"),
    COMMENTS("comments"),
    CREATED("created"),
    MODIFIED("modified"),
    VIEWS("views");

    Fields(String fieldName) {
        this.fieldName = fieldName;
    }

    private final String fieldName;

    public String getFieldName() {
        return fieldName;
    }

    public static List<String> getAllFieldNames() {
        return Arrays.asList(
            AUTHOR.getFieldName(),
            TITLE.getFieldName(),
            CONTENT.getFieldName(),
            BLOG.getFieldName(),
            STATE.getFieldName(),
            COMMENTS.getFieldName(),
            CREATED.getFieldName(),
            MODIFIED.getFieldName(),
            VIEWS.getFieldName()
        );
    }
}
