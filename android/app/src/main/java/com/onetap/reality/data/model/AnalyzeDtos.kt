package com.onetap.reality.data.model

import kotlinx.serialization.Serializable

@Serializable
data class AnalyzeRequestDto(
    val image: String // data:image/jpeg;base64,...
)

@Serializable
data class AnalyzeResponseDto(
    val context: String = "unknown",
    val title: String = "Visual Subject",
    val summary: String = "",
    val keyTakeaway: String? = null,
    val temporalState: String = "unknown",
    val confidence: Float = 1.0f,
    val entitiesList: List<EntityDto> = emptyList(),
    val lineItems: List<LineItemDto> = emptyList(),
    val languageDetected: LanguageDto? = null,
    val emergencyDetected: Boolean = false,
    val fields: Map<String, FieldDto> = emptyMap(),
    val actions: List<ActionDto> = emptyList(),
    val webGroundingUsed: Boolean = false
)

@Serializable
data class EntityDto(
    val name: String,
    val type: String,
    val role: String? = null
)

@Serializable
data class LineItemDto(
    val label: String,
    val value: String,
    val amount: Double? = null,
    val unit: String? = null
)

@Serializable
data class LanguageDto(
    val code: String,
    val name: String,
    val originalSnippet: String? = null,
    val translatedEnglish: String? = null
)

@Serializable
data class FieldDto(
    val value: String,
    val status: String,
    val source: String,
    val confidence: Float = 1.0f,
    val evidence: String? = null,
    val sourceUrl: String? = null,
    val note: String? = null
)

@Serializable
data class ActionDto(
    val id: String,
    val label: String,
    val description: String,
    val type: String,
    val payload: Map<String, String> = emptyMap()
)
