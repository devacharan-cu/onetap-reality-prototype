package com.onetap.reality

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.onetap.reality.navigation.OneTapNavGraph
import com.onetap.reality.ui.chat.ChatViewModel
import com.onetap.reality.ui.home.HomeViewModel
import com.onetap.reality.ui.history.HistoryViewModel
import com.onetap.reality.ui.results.ResultsViewModel
import com.onetap.reality.ui.theme.OneTapTheme
import com.onetap.reality.ui.theme.Zinc950

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as OneTapApplication
        val analysisRepository = app.analysisRepository
        val historyRepository = app.historyRepository

        setContent {
            OneTapTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Zinc950
                ) {
                    val navController = rememberNavController()
                    val homeViewModel = remember { HomeViewModel(analysisRepository, historyRepository) }
                    val historyViewModel = remember { HistoryViewModel(historyRepository) }
                    val resultsViewModel = remember { ResultsViewModel() }
                    val chatViewModel = remember { ChatViewModel(analysisRepository) }

                    OneTapNavGraph(
                        navController = navController,
                        homeViewModel = homeViewModel,
                        historyViewModel = historyViewModel,
                        resultsViewModel = resultsViewModel,
                        chatViewModel = chatViewModel
                    )
                }
            }
        }
    }
}
