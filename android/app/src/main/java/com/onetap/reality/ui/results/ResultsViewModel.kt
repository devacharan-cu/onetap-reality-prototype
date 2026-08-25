package com.onetap.reality.ui.results

import androidx.lifecycle.ViewModel
import com.onetap.reality.domain.model.CanonicalResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class ResultsViewModel : ViewModel() {

    private val _currentResult = MutableStateFlow<CanonicalResult?>(null)
    val currentResult = _currentResult.asStateFlow()

    private val _isChatOpen = MutableStateFlow(false)
    val isChatOpen = _isChatOpen.asStateFlow()

    fun setResult(result: CanonicalResult) {
        _currentResult.value = result
    }

    fun openChat() {
        _isChatOpen.value = true
    }

    fun closeChat() {
        _isChatOpen.value = false
    }

    fun clearResult() {
        _currentResult.value = null
        _isChatOpen.value = false
    }
}
