package com.onetap.reality.domain.model

enum class ActionType {
    CALENDAR,
    MAPS,
    SEARCH,
    CALL,
    EMAIL,
    BROWSE,
    COPY,
    SHARE
}

data class ActionItem(
    val id: String,
    val label: String,
    val description: String,
    val type: ActionType,
    val payload: Map<String, String> = emptyMap()
)
