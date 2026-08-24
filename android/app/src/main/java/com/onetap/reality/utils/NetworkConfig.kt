package com.onetap.reality.utils

import android.content.Context
import android.content.SharedPreferences

object NetworkConfig {
    private const val PREFS_NAME = "onetap_network_prefs"
    private const val KEY_BASE_URL = "api_base_url"

    // Default for Android Emulator to connect to development machine port 3001
    const val DEFAULT_EMULATOR_BASE_URL = "http://10.0.2.2:3001"
    
    // Default for localhost (if using adb reverse tcp:3001 tcp:3001)
    const val DEFAULT_LOCALHOST_BASE_URL = "http://localhost:3001"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getBaseUrl(context: Context): String {
        return getPrefs(context).getString(KEY_BASE_URL, DEFAULT_EMULATOR_BASE_URL) ?: DEFAULT_EMULATOR_BASE_URL
    }

    fun setBaseUrl(context: Context, url: String) {
        val sanitized = if (url.endsWith("/")) url.dropLast(1) else url
        getPrefs(context).edit().putString(KEY_BASE_URL, sanitized).apply()
    }
}
