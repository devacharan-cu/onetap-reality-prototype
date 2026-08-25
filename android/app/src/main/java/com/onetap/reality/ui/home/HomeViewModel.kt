package com.onetap.reality.ui.home

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onetap.reality.data.api.NetworkResult
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.repository.AnalysisRepository
import com.onetap.reality.domain.repository.HistoryRepository
import com.onetap.reality.utils.ImageUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class HomeUiState {
    data object Idle : HomeUiState()
    data object Analyzing : HomeUiState()
    data class Success(val result: CanonicalResult) : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}

class HomeViewModel(
    private val analysisRepository: AnalysisRepository,
    private val historyRepository: HistoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Idle)
    val uiState = _uiState.asStateFlow()

    private val _isSettingsOpen = MutableStateFlow(false)
    val isSettingsOpen = _isSettingsOpen.asStateFlow()

    private val _isHistoryOpen = MutableStateFlow(false)
    val isHistoryOpen = _isHistoryOpen.asStateFlow()

    fun openSettings() { _isSettingsOpen.value = true }
    fun closeSettings() { _isSettingsOpen.value = false }

    fun openHistory() { _isHistoryOpen.value = true }
    fun closeHistory() { _isHistoryOpen.value = false }

    fun resetState() {
        _uiState.value = HomeUiState.Idle
    }

    fun selectHistoryResult(result: CanonicalResult) {
        _uiState.value = HomeUiState.Success(result)
    }

    fun analyzeImage(base64DataUri: String, thumbnailBase64: String? = null) {
        _uiState.value = HomeUiState.Analyzing

        viewModelScope.launch {
            when (val res = analysisRepository.analyzeImage(base64DataUri)) {
                is NetworkResult.Success -> {
                    historyRepository.saveScan(res.data, thumbnailBase64)
                    _uiState.value = HomeUiState.Success(res.data)
                }
                is NetworkResult.Error -> {
                    _uiState.value = HomeUiState.Error(res.message)
                }
                is NetworkResult.Exception -> {
                    _uiState.value = HomeUiState.Error(
                        "Could not connect to the OneTap Reality AI server. Please verify the API Host in Settings."
                    )
                }
            }
        }
    }

    fun analyzeFromGalleryUri(context: Context, uri: Uri) {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Analyzing
            val base64 = ImageUtils.uriToBase64DataUri(context, uri)
            if (base64 != null) {
                analyzeImage(base64)
            } else {
                _uiState.value = HomeUiState.Error("Failed to decode image from gallery.")
            }
        }
    }
}
