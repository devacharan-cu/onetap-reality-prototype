package com.onetap.reality.navigation

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.onetap.reality.ui.analysis.AnalysisLoadingScreen
import com.onetap.reality.ui.camera.CameraScreen
import com.onetap.reality.ui.chat.ChatViewModel
import com.onetap.reality.ui.home.HomeScreen
import com.onetap.reality.ui.home.HomeUiState
import com.onetap.reality.ui.home.HomeViewModel
import com.onetap.reality.ui.history.HistoryViewModel
import com.onetap.reality.ui.results.ResultsScreen
import com.onetap.reality.ui.results.ResultsViewModel
import com.onetap.reality.ui.theme.Emerald500
import com.onetap.reality.ui.theme.PureBlack
import com.onetap.reality.ui.theme.PureWhite
import com.onetap.reality.ui.theme.Zinc400
import com.onetap.reality.ui.theme.Zinc900

@Composable
fun OneTapNavGraph(
    navController: NavHostController,
    homeViewModel: HomeViewModel,
    historyViewModel: HistoryViewModel,
    resultsViewModel: ResultsViewModel,
    chatViewModel: ChatViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by homeViewModel.uiState.collectAsState()
    val currentResult by resultsViewModel.currentResult.collectAsState()

    // Observe analysis state transitions
    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is HomeUiState.Analyzing -> {
                navController.navigate(Screen.Analysis.route) {
                    launchSingleTop = true
                }
            }
            is HomeUiState.Success -> {
                resultsViewModel.setResult(state.result)
                chatViewModel.clearChat()
                navController.navigate(Screen.Results.route) {
                    popUpTo(Screen.Home.route)
                }
            }
            is HomeUiState.Idle -> {
                // Return to home if needed
            }
            is HomeUiState.Error -> {
                // Handled via Dialog
            }
        }
    }

    // Error Dialog
    if (uiState is HomeUiState.Error) {
        val errorMsg = (uiState as HomeUiState.Error).message
        AlertDialog(
            onDismissRequest = {
                homeViewModel.resetState()
                navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } }
            },
            title = { Text("Analysis Notice", color = PureWhite) },
            text = { Text(errorMsg, color = Zinc400) },
            confirmButton = {
                Button(
                    onClick = {
                        homeViewModel.resetState()
                        navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = PureBlack)
                ) {
                    Text("OK")
                }
            },
            containerColor = Zinc900
        )
    }

    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = modifier
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onOpenPointAndCapture = {
                    navController.navigate(Screen.Camera.route)
                },
                onResultSelected = { result ->
                    resultsViewModel.setResult(result)
                    chatViewModel.clearChat()
                    navController.navigate(Screen.Results.route)
                },
                homeViewModel = homeViewModel,
                historyViewModel = historyViewModel
            )
        }

        composable(Screen.Camera.route) {
            CameraScreen(
                onImageCaptured = { base64DataUri, thumbBase64 ->
                    homeViewModel.analyzeImage(base64DataUri, thumbBase64)
                },
                onClose = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Analysis.route) {
            AnalysisLoadingScreen(
                onCancel = {
                    homeViewModel.resetState()
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Results.route) {
            currentResult?.let { result ->
                ResultsScreen(
                    result = result,
                    onScanAgain = {
                        homeViewModel.resetState()
                        resultsViewModel.clearResult()
                        chatViewModel.clearChat()
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                    },
                    resultsViewModel = resultsViewModel,
                    chatViewModel = chatViewModel
                )
            }
        }
    }
}
