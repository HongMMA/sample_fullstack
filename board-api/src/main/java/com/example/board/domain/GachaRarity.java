package com.example.board.domain;

public enum GachaRarity {
    NORMAL(1, "일반"),
    MAGIC(2, "매직"),
    RARE(3, "레어"),
    UNIQUE(4, "유니크"),
    LEGEND(5, "레전드"),
    GOAT(6, "GOAT");

    private final int tier;
    private final String label;

    GachaRarity(int tier, String label) {
        this.tier = tier;
        this.label = label;
    }

    public int getTier() {
        return tier;
    }

    public String getLabel() {
        return label;
    }
}
