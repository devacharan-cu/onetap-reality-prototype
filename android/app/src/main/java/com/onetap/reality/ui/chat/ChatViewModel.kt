package com.onetap.reality.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onetap.reality.data.api.NetworkResult
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.model.ChatMessage
import com.onetap.reality.domain.model.ChatSender
import com.onetap.reality.domain.repository.AnalysisRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ChatViewModel(
    private val analysisRepository: AnalysisRepository
) : ViewModel() {

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages = _messages.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _inputText = MutableStateFlow("")
    val inputText = _inputText.asStateFlow()

    fun onInputTextChanged(newText: String) {
        _inputText.value = newText
    }

    fun sendMessage(question: String, currentResult: CanonicalResult) {
        if (question.isBlank() || _isLoading.value) return

        val userMessage = ChatMessage(sender = ChatSender.USER, text = question.trim())
        _messages.value = _messages.value + userMessage
        _inputText.value = ""
        _isLoading.value = true

        viewModelScope.launch {
            val result = analysisRepository.sendChatMessage(
                message = userMessage.text,
                history = _messages.value.dropLast(1),
                currentResult = currentResult
            )

            _isLoading.value = false
            when (result) {
                is NetworkResult.Success -> {
                    val assistantMessage = ChatMessage(sender = ChatSender.ASSISTANT, text = result.data)
                    _messages.value = _messages.value + assistantMessage
                }
                is NetworkResult.Error -> {
                    val errorMessage = ChatMessage(sender = ChatSender.ASSISTANT, text = "Error: ${result.message}")
                    _messages.value = _messages.value + errorMessage
                }
                is NetworkResult.Exception -> {
                    val errorMessage = ChatMessage(
                        sender = ChatSender.ASSISTANT,
                        text = "Could not connect to the AI service. Please check your network connection."
                    )
                    _messages.value = _messages.value + errorMessage
                }
            }
        }
    }

    fun clearChat() {
        _messages.value = emptyList()
        _inputText.value = ""
        _isLoading.value = false
    }
}
