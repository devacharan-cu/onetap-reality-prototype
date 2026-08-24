package com.onetap.reality.domain.model

data class CanonicalResult(
    val context: String,
    val title: String,
    val summary: String,
    val keyTakeaway: String?,
    val temporalState: String,
    val confidence: Float,
    val entitiesList: List<EntityItem> = emptyList(),
    val lineItems: List<LineItem> = emptyList(),
    val languageDetected: LanguageInfo? = null,
    val emergencyDetected: Boolean = false,
    val fields: Map<String, ExtractedField> = emptyMap(),
    val actions: List<ActionItem> = emptyList(),
    val webGroundingUsed: Boolean = false,
    val originalImageUri: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class EntityItem(
    val name: String,
    val type: String,
    val role: String? = null
)

data class LineItem(
    val label: String,
    val value: String,
    val amount: Double? = null,
    val unit: String? = null
)

data class LanguageInfo(
    val code: String,
    val name: String,
    val originalSnippet: String? = null,
    val translatedEnglish: String? = null
)
