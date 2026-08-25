package com.onetap.reality.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.model.HistoryItem
import com.onetap.reality.domain.repository.HistoryRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class HistoryViewModel(
    private val historyRepository: HistoryRepository
) : ViewModel() {

    val historyItems: StateFlow<List<HistoryItem>> = historyRepository.getHistory()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun deleteScan(id: String) {
        viewModelScope.launch {
            historyRepository.deleteScan(id)
        }
    }

    fun clearAll() {
        viewModelScope.launch {
            historyRepository.clearAll()
        }
    }

    fun saveScan(result: CanonicalResult, thumbnailBase64: String?) {
        viewModelScope.launch {
            historyRepository.saveScan(result, thumbnailBase64)
        }
    }
}
