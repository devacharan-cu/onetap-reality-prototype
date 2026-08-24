package com.onetap.reality.domain.repository

import com.onetap.reality.data.api.NetworkResult
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.model.ChatMessage

interface AnalysisRepository {
    suspend fun analyzeImage(base64DataUri: String): NetworkResult<CanonicalResult>
    suspend fun sendChatMessage(
        message: String,
        history: List<ChatMessage>,
        currentResult: CanonicalResult
    ): NetworkResult<String>
}
