package com.onetap.reality.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ChatRequestDto(
    val message: String,
    val history: List<ChatHistoryItemDto> = emptyList(),
    val context: String = "general",
    val title: String = "Visual Subject",
    val summary: String = "",
    val keyTakeaway: String? = null,
    val temporalState: String = "unknown",
    val entitiesList: List<EntityDto> = emptyList(),
    val lineItems: List<LineItemDto> = emptyList(),
    val fields: Map<String, FieldDto> = emptyMap()
)

@Serializable
data class ChatHistoryItemDto(
    val sender: String, // "user" or "assistant"
    val text: String
)

@Serializable
data class ChatResponseDto(
    val answer: String
)

@Serializable
data class ErrorResponseDto(
    val error: String
)
