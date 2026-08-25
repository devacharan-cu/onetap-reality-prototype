package com.onetap.reality

import android.app.Application
import com.onetap.reality.data.api.OneTapApiService
import com.onetap.reality.data.repository.AnalysisRepositoryImpl
import com.onetap.reality.data.repository.HistoryRepositoryImpl
import com.onetap.reality.domain.repository.AnalysisRepository
import com.onetap.reality.domain.repository.HistoryRepository

class OneTapApplication : Application() {

    lateinit var analysisRepository: AnalysisRepository
        private set

    lateinit var historyRepository: HistoryRepository
        private set

    override fun onCreate() {
        super.onCreate()

        val apiService = OneTapApiService(this)
        analysisRepository = AnalysisRepositoryImpl(apiService)
        historyRepository = HistoryRepositoryImpl(this)
    }
}
