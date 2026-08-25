package com.onetap.reality.navigation

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Camera : Screen("camera")
    data object Analysis : Screen("analysis")
    data object Results : Screen("results")
}
