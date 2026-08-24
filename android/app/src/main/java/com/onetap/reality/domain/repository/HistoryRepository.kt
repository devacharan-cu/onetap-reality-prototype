package com.onetap.reality.domain.repository

import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.model.HistoryItem
import kotlinx.coroutines.flow.Flow

interface HistoryRepository {
    fun getHistory(): Flow<List<HistoryItem>>
    suspend fun saveScan(result: CanonicalResult, thumbnailBase64: String?)
    suspend fun deleteScan(id: String)
    suspend fun clearAll()
}
