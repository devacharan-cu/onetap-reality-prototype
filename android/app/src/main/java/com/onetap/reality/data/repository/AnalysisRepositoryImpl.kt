package com.onetap.reality.data.repository

import com.onetap.reality.data.api.NetworkResult
import com.onetap.reality.data.api.OneTapApiService
import com.onetap.reality.data.model.ActionDto
import com.onetap.reality.data.model.AnalyzeResponseDto
import com.onetap.reality.data.model.ChatHistoryItemDto
import com.onetap.reality.data.model.ChatRequestDto
import com.onetap.reality.data.model.EntityDto
import com.onetap.reality.data.model.FieldDto
import com.onetap.reality.data.model.LineItemDto
import com.onetap.reality.domain.model.ActionItem
import com.onetap.reality.domain.model.ActionType
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.model.ChatMessage
import com.onetap.reality.domain.model.ChatSender
import com.onetap.reality.domain.model.EntityItem
import com.onetap.reality.domain.model.ExtractedField
import com.onetap.reality.domain.model.FieldSource
import com.onetap.reality.domain.model.FieldStatus
import com.onetap.reality.domain.model.LanguageInfo
import com.onetap.reality.domain.model.LineItem
import com.onetap.reality.domain.repository.AnalysisRepository

class AnalysisRepositoryImpl(
    private val apiService: OneTapApiService
) : AnalysisRepository {

    override suspend fun analyzeImage(base64DataUri: String): NetworkResult<CanonicalResult> {
        return when (val result = apiService.analyzeImage(base64DataUri)) {
            is NetworkResult.Success -> NetworkResult.Success(mapDtoToDomain(result.data, base64DataUri))
            is NetworkResult.Error -> NetworkResult.Error(result.message, result.statusCode)
            is NetworkResult.Exception -> NetworkResult.Exception(result.e)
        }
    }

    override suspend fun sendChatMessage(
        message: String,
        history: List<ChatMessage>,
        currentResult: CanonicalResult
    ): NetworkResult<String> {
        val historyDtos = history.map {
            ChatHistoryItemDto(
                sender = if (it.sender == ChatSender.USER) "user" else "assistant",
                text = it.text
            )
        }

        val fieldsDtos = currentResult.fields.mapValues { (_, field) ->
            FieldDto(
                value = field.value,
                status = field.status.raw,
                source = field.source.raw,
                confidence = field.confidence,
                evidence = field.evidence,
                sourceUrl = field.sourceUrl,
                note = field.note
            )
        }

        val entityDtos = currentResult.entitiesList.map {
            EntityDto(name = it.name, type = it.type, role = it.role)
        }

        val lineItemDtos = currentResult.lineItems.map {
            LineItemDto(label = it.label, value = it.value, amount = it.amount, unit = it.unit)
        }

        val chatRequest = ChatRequestDto(
            message = message,
            history = historyDtos,
            context = currentResult.context,
            title = currentResult.title,
            summary = currentResult.summary,
            keyTakeaway = currentResult.keyTakeaway,
            temporalState = currentResult.temporalState,
            entitiesList = entityDtos,
            lineItems = lineItemDtos,
            fields = fieldsDtos
        )

        return when (val res = apiService.sendChatMessage(chatRequest)) {
            is NetworkResult.Success -> NetworkResult.Success(res.data.answer)
            is NetworkResult.Error -> NetworkResult.Error(res.message, res.statusCode)
            is NetworkResult.Exception -> NetworkResult.Exception(res.e)
        }
    }

    private fun mapDtoToDomain(dto: AnalyzeResponseDto, imageUri: String): CanonicalResult {
        val fieldLabels = mapOf(
            "eventTitle" to "Event Name",
            "date" to "Date",
            "time" to "Time",
            "location" to "Location",
            "phoneNumber" to "Phone Number",
            "email" to "Email Address",
            "website" to "Website",
            "productName" to "Product / Item",
            "routeNumber" to "Transit / Route",
            "price" to "Price / Cost",
            "organization" to "Organization",
            "qrCodeData" to "QR Code Data",
            "language" to "Detected Language"
        )

        val domainFields = dto.fields.mapValues { (key, fieldDto) ->
            ExtractedField(
                key = key,
                label = fieldLabels[key] ?: key.replaceFirstChar { it.uppercase() },
                value = fieldDto.value,
                status = FieldStatus.fromRaw(fieldDto.status),
                source = FieldSource.fromRaw(fieldDto.source),
                confidence = fieldDto.confidence,
                evidence = fieldDto.evidence,
                sourceUrl = fieldDto.sourceUrl,
                note = fieldDto.note
            )
        }

        val domainActions = dto.actions.map { mapActionDto(it) }

        return CanonicalResult(
            context = dto.context,
            title = dto.title,
            summary = dto.summary,
            keyTakeaway = dto.keyTakeaway,
            temporalState = dto.temporalState,
            confidence = dto.confidence,
            entitiesList = dto.entitiesList.map { EntityItem(it.name, it.type, it.role) },
            lineItems = dto.lineItems.map { LineItem(it.label, it.value, it.amount, it.unit) },
            languageDetected = dto.languageDetected?.let {
                LanguageInfo(it.code, it.name, it.originalSnippet, it.translatedEnglish)
            },
            emergencyDetected = dto.emergencyDetected,
            fields = domainFields,
            actions = domainActions,
            webGroundingUsed = dto.webGroundingUsed,
            originalImageUri = imageUri
        )
    }

    private fun mapActionDto(dto: ActionDto): ActionItem {
        val actionType = when (dto.type.lowercase()) {
            "calendar" -> ActionType.CALENDAR
            "maps", "directions" -> ActionType.MAPS
            "search" -> ActionType.SEARCH
            "call", "phone" -> ActionType.CALL
            "email" -> ActionType.EMAIL
            "browse", "website" -> ActionType.BROWSE
            "share" -> ActionType.SHARE
            else -> ActionType.COPY
        }
        return ActionItem(
            id = dto.id,
            label = dto.label,
            description = dto.description,
            type = actionType,
            payload = dto.payload
        )
    }
}
