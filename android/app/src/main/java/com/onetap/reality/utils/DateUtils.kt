package com.onetap.reality.utils

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object DateUtils {
    fun formatHistoryTime(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        val date = Date(timestamp)

        return when {
            diff < 60_000 -> "Just now"
            diff < 3600_000 -> "${diff / 60_000}m ago"
            diff < 86400_000 -> {
                val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
                "Today · ${timeFormat.format(date)}"
            }
            diff < 172800_000 -> {
                val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
                "Yesterday · ${timeFormat.format(date)}"
            }
            else -> {
                val fullFormat = SimpleDateFormat("MMM d · h:mm a", Locale.getDefault())
                fullFormat.format(date)
            }
        }
    }
}
