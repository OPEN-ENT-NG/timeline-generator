package net.atos.entng.timelinegenerator.enums;

public enum ViewEnum {
    VIEW("view"),
    HOME("home"),
    RESOURCE("resource");

    private final String value;

    ViewEnum(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
