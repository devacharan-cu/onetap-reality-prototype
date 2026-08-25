package com.onetap.reality.utils

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.CalendarContract
import android.widget.Toast
import com.onetap.reality.domain.model.CanonicalResult
import java.util.Calendar

object IntentUtils {

    fun openCalendar(context: Context, title: String, dateText: String, location: String = "") {
        try {
            val intent = Intent(Intent.ACTION_INSERT).apply {
                data = CalendarContract.Events.CONTENT_URI
                putExtra(CalendarContract.Events.TITLE, title)
                putExtra(CalendarContract.Events.DESCRIPTION, "Added from OneTap Reality — Verified information: $dateText")
                if (location.isNotBlank() && location != "Not mentioned") {
                    putExtra(CalendarContract.Events.EVENT_LOCATION, location)
                }
                putExtra(CalendarContract.EXTRA_EVENT_ALL_DAY, true)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "No calendar application found", Toast.LENGTH_SHORT).show()
        }
    }

    fun openMaps(context: Context, locationQuery: String) {
        try {
            val uri = Uri.parse("geo:0,0?q=" + Uri.encode(locationQuery))
            val intent = Intent(Intent.ACTION_VIEW, uri)
            context.startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "No maps application found", Toast.LENGTH_SHORT).show()
        }
    }

    fun dialPhone(context: Context, phoneNumber: String) {
        try {
            val cleanNumber = phoneNumber.replace("[^0-9+]".toRegex(), "")
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber"))
            context.startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "Cannot open dialer", Toast.LENGTH_SHORT).show()
        }
    }

    fun openBrowser(context: Context, url: String) {
        try {
            val safeUrl = if (url.startsWith("http://") || url.startsWith("https://")) {
                url
            } else {
                "https://$url"
            }
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(safeUrl))
            context.startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "Cannot open web link", Toast.LENGTH_SHORT).show()
        }
    }

    fun openGoogleSearch(context: Context, query: String) {
        openBrowser(context, "https://www.google.com/search?q=" + Uri.encode(query))
    }

    fun copyToClipboard(context: Context, text: String, label: String = "OneTap Reality") {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    fun shareResult(context: Context, result: CanonicalResult) {
        try {
            val sb = StringBuilder()
            sb.appendLine("★ ${result.title}")
            sb.appendLine(result.summary)
            sb.appendLine()

            val verifiedFields = result.fields.values.filter {
                it.status.raw.contains("verified") && it.value.isNotBlank() && it.value != "Not mentioned"
            }
            if (verifiedFields.isNotEmpty()) {
                sb.appendLine("VERIFIED DETAILS:")
                for (field in verifiedFields) {
                    sb.appendLine("• ${field.label}: ${field.value}")
                }
            }
            sb.appendLine()
            sb.appendLine("Captured with OneTap Reality (Zero Hallucinations)")

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, result.title)
                putExtra(Intent.EXTRA_TEXT, sb.toString().trim())
            }
            context.startActivity(Intent.createChooser(shareIntent, "Share Verified Info"))
        } catch (_: Exception) {
            Toast.makeText(context, "Cannot share information", Toast.LENGTH_SHORT).show()
        }
    }
}
