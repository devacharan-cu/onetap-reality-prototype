package com.onetap.reality.domain.model

data class ExtractedField(
    val key: String,
    val label: String,
    val value: String,
    val status: FieldStatus,
    val source: FieldSource,
    val confidence: Float = 1.0f,
    val evidence: String? = null,
    val sourceUrl: String? = null,
    val note: String? = null
)
