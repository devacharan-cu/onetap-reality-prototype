package com.onetap.reality.domain.model

enum class FieldSource(val raw: String) {
    IMAGE("image"),
    WEB("web"),
    INFERENCE("inference"),
    NONE("none");

    companion object {
        fun fromRaw(raw: String?): FieldSource {
            return entries.find { it.raw.equals(raw, ignoreCase = true) } ?: NONE
        }
    }
}
