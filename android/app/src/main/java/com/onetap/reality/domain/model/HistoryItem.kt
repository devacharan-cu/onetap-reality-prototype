package com.onetap.reality.domain.model

data class HistoryItem(
    val id: String,
    val timestamp: Long,
    val context: String,
    val title: String,
    val summary: String,
    val thumbnailBase64: String? = null,
    val result: CanonicalResult
)
