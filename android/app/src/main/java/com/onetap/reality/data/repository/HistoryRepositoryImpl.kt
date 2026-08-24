package com.onetap.reality.data.repository

import android.content.Context
import com.onetap.reality.data.model.ActionDto
import com.onetap.reality.data.model.AnalyzeResponseDto
import com.onetap.reality.data.model.EntityDto
import com.onetap.reality.data.model.FieldDto
import com.onetap.reality.data.model.LanguageDto
import com.onetap.reality.data.model.LineItemDto
import com.onetap.reality.domain.model.ActionItem
import com.onetap.reality.domain.model.ActionType
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.model.EntityItem
import com.onetap.reality.domain.model.ExtractedField
import com.onetap.reality.domain.model.FieldSource
import com.onetap.reality.domain.model.FieldStatus
import com.onetap.reality.domain.model.HistoryItem
import com.onetap.reality.domain.model.LanguageInfo
import com.onetap.reality.domain.model.LineItem
import com.onetap.reality.domain.repository.HistoryRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.util.UUID

class HistoryRepositoryImpl(
    private val context: Context
) : HistoryRepository {

    private val prefs = context.getSharedPreferences("onetap_history_prefs", Context.MODE_PRIVATE)
    private val keyHistory = "scan_history_json"

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val _historyFlow = MutableStateFlow<List<HistoryItem>>(emptyList())

    init {
        loadInitialHistory()
    }

    override fun getHistory(): Flow<List<HistoryItem>> = _historyFlow.asStateFlow()

    private fun loadInitialHistory() {
        val rawJson = prefs.getString(keyHistory, "[]") ?: "[]"
        val items = try {
            val dtos = json.decodeFromString<List<HistoryItemDto>>(rawJson)
            dtos.map { mapHistoryDtoToDomain(it) }
        } catch (_: Exception) {
            emptyList()
        }
        _historyFlow.value = items
    }

    override suspend fun saveScan(result: CanonicalResult, thumbnailBase64: String?) {
        withContext(Dispatchers.IO) {
            val current = _historyFlow.value
            // Prevent exact consecutive duplicate scans
            if (current.isNotEmpty() && current.first().title == result.title && current.first().summary == result.summary) {
                return@withContext
            }

            val newItem = HistoryItem(
                id = "scan-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(5)}",
                timestamp = System.currentTimeMillis(),
                context = result.context,
                title = result.title,
                summary = result.summary,
                thumbnailBase64 = thumbnailBase64,
                result = result
            )

            val updated = listOf(newItem) + current.take(19)
            _historyFlow.value = updated
            persistHistory(updated)
        }
    }

    override suspend fun deleteScan(id: String) {
        withContext(Dispatchers.IO) {
            val updated = _historyFlow.value.filter { it.id != id }
            _historyFlow.value = updated
            persistHistory(updated)
        }
    }

    override suspend fun clearAll() {
        withContext(Dispatchers.IO) {
            _historyFlow.value = emptyList()
            persistHistory(emptyList())
        }
    }

    private fun persistHistory(items: List<HistoryItem>) {
        try {
            val dtos = items.map { mapDomainToHistoryDto(it) }
            val raw = json.encodeToString<List<HistoryItemDto>>(dtos)
            prefs.edit().putString(keyHistory, raw).apply()
        } catch (_: Exception) {
            // Ignore persistence quota errors safely
        }
    }

    private fun mapDomainToHistoryDto(item: HistoryItem): HistoryItemDto {
        return HistoryItemDto(
            id = item.id,
            timestamp = item.timestamp,
            context = item.context,
            title = item.title,
            summary = item.summary,
            thumbnailBase64 = item.thumbnailBase64,
            result = AnalyzeResponseDto(
                context = item.result.context,
                title = item.result.title,
                summary = item.result.summary,
                keyTakeaway = item.result.keyTakeaway,
                temporalState = item.result.temporalState,
                confidence = item.result.confidence,
                entitiesList = item.result.entitiesList.map { EntityDto(it.name, it.type, it.role) },
                lineItems = item.result.lineItems.map { LineItemDto(it.label, it.value, it.amount, it.unit) },
                languageDetected = item.result.languageDetected?.let {
                    LanguageDto(it.code, it.name, it.originalSnippet, it.translatedEnglish)
                },
                emergencyDetected = item.result.emergencyDetected,
                fields = item.result.fields.mapValues { (_, f) ->
                    FieldDto(
                        value = f.value,
                        status = f.status.raw,
                        source = f.source.raw,
                        confidence = f.confidence,
                        evidence = f.evidence,
                        sourceUrl = f.sourceUrl,
                        note = f.note
                    )
                },
                actions = item.result.actions.map {
                    ActionDto(
                        id = it.id,
                        label = it.label,
                        description = it.description,
                        type = it.type.name.lowercase(),
                        payload = it.payload
                    )
                },
                webGroundingUsed = item.result.webGroundingUsed
            )
        )
    }

    private fun mapHistoryDtoToDomain(dto: HistoryItemDto): HistoryItem {
        val domainFields = dto.result.fields.mapValues { (key, fieldDto) ->
            ExtractedField(
                key = key,
                label = key.replaceFirstChar { it.uppercase() },
                value = fieldDto.value,
                status = FieldStatus.fromRaw(fieldDto.status),
                source = FieldSource.fromRaw(fieldDto.source),
                confidence = fieldDto.confidence,
                evidence = fieldDto.evidence,
                sourceUrl = fieldDto.sourceUrl,
                note = fieldDto.note
            )
        }

        val domainActions = dto.result.actions.map { actionDto ->
            ActionItem(
                id = actionDto.id,
                label = actionDto.label,
                description = actionDto.description,
                type = ActionType.valueOf(actionDto.type.uppercase()),
                payload = actionDto.payload
            )
        }

        val canonical = CanonicalResult(
            context = dto.result.context,
            title = dto.result.title,
            summary = dto.result.summary,
            keyTakeaway = dto.result.keyTakeaway,
            temporalState = dto.result.temporalState,
            confidence = dto.result.confidence,
            entitiesList = dto.result.entitiesList.map { EntityItem(it.name, it.type, it.role) },
            lineItems = dto.result.lineItems.map { LineItem(it.label, it.value, it.amount, it.unit) },
            languageDetected = dto.result.languageDetected?.let {
                LanguageInfo(it.code, it.name, it.originalSnippet, it.translatedEnglish)
            },
            emergencyDetected = dto.result.emergencyDetected,
            fields = domainFields,
            actions = domainActions,
            webGroundingUsed = dto.result.webGroundingUsed
        )

        return HistoryItem(
            id = dto.id,
            timestamp = dto.timestamp,
            context = dto.context,
            title = dto.title,
            summary = dto.summary,
            thumbnailBase64 = dto.thumbnailBase64,
            result = canonical
        )
    }
}

@Serializable
private data class HistoryItemDto(
    val id: String,
    val timestamp: Long,
    val context: String,
    val title: String,
    val summary: String,
    val thumbnailBase64: String? = null,
    val result: AnalyzeResponseDto
)
