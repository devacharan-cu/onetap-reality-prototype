package com.onetap.reality.data.api

import android.content.Context
import com.onetap.reality.data.model.AnalyzeRequestDto
import com.onetap.reality.data.model.AnalyzeResponseDto
import com.onetap.reality.data.model.ChatRequestDto
import com.onetap.reality.data.model.ChatResponseDto
import com.onetap.reality.data.model.ErrorResponseDto
import com.onetap.reality.utils.NetworkConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class OneTapApiService(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        encodeDefaults = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .writeTimeout(45, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun analyzeImage(base64DataUri: String): NetworkResult<AnalyzeResponseDto> =
        withContext(Dispatchers.IO) {
            try {
                val baseUrl = NetworkConfig.getBaseUrl(context)
                val requestDto = AnalyzeRequestDto(image = base64DataUri)
                val bodyString = json.encodeToString(AnalyzeRequestDto.serializer(), requestDto)

                val request = Request.Builder()
                    .url("$baseUrl/api/analyze")
                    .post(bodyString.toRequestBody(jsonMediaType))
                    .header("Accept", "application/json")
                    .build()

                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string().orEmpty()
                    if (response.isSuccessful) {
                        val parsed = json.decodeFromString(AnalyzeResponseDto.serializer(), responseBody)
                        NetworkResult.Success(parsed)
                    } else {
                        val errorMessage = try {
                            val errDto = json.decodeFromString(ErrorResponseDto.serializer(), responseBody)
                            errDto.error
                        } catch (_: Exception) {
                            "Analysis failed with HTTP status ${response.code}"
                        }
                        NetworkResult.Error(errorMessage, response.code)
                    }
                }
            } catch (e: Exception) {
                NetworkResult.Exception(e)
            }
        }

    suspend fun sendChatMessage(requestDto: ChatRequestDto): NetworkResult<ChatResponseDto> =
        withContext(Dispatchers.IO) {
            try {
                val baseUrl = NetworkConfig.getBaseUrl(context)
                val bodyString = json.encodeToString(ChatRequestDto.serializer(), requestDto)

                val request = Request.Builder()
                    .url("$baseUrl/api/chat")
                    .post(bodyString.toRequestBody(jsonMediaType))
                    .header("Accept", "application/json")
                    .build()

                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string().orEmpty()
                    if (response.isSuccessful) {
                        val parsed = json.decodeFromString(ChatResponseDto.serializer(), responseBody)
                        NetworkResult.Success(parsed)
                    } else {
                        val errorMessage = try {
                            val errDto = json.decodeFromString(ErrorResponseDto.serializer(), responseBody)
                            errDto.error
                        } catch (_: Exception) {
                            "Chat failed with HTTP status ${response.code}"
                        }
                        NetworkResult.Error(errorMessage, response.code)
                    }
                }
            } catch (e: Exception) {
                NetworkResult.Exception(e)
            }
        }
}
