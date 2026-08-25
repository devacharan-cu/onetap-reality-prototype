package com.onetap.reality.domain.model

enum class FieldStatus(val raw: String) {
    VERIFIED("verified"),
    WEB_VERIFIED("web_verified"),
    UNCERTAIN("uncertain"),
    NOT_MENTIONED("not_mentioned");

    companion object {
        fun fromRaw(raw: String?): FieldStatus {
            return entries.find { it.raw.equals(raw, ignoreCase = true) } ?: UNCERTAIN
        }
    }
}
