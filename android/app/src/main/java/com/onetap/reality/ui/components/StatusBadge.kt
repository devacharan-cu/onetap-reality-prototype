package com.onetap.reality.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.HelpOutline
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.RemoveCircleOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onetap.reality.domain.model.FieldStatus
import com.onetap.reality.ui.theme.Amber400
import com.onetap.reality.ui.theme.Amber950
import com.onetap.reality.ui.theme.Blue400
import com.onetap.reality.ui.theme.Blue950
import com.onetap.reality.ui.theme.Emerald400
import com.onetap.reality.ui.theme.Emerald950
import com.onetap.reality.ui.theme.Zinc400
import com.onetap.reality.ui.theme.Zinc800
import com.onetap.reality.ui.theme.Zinc900

@Composable
fun StatusBadge(
    status: FieldStatus,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, borderColor, icon, label) = when (status) {
        FieldStatus.VERIFIED -> {
            Tuple5(
                Emerald950.copy(alpha = 0.8f),
                Emerald400,
                Emerald400.copy(alpha = 0.3f),
                Icons.Rounded.CheckCircle,
                "FROM IMAGE"
            )
        }
        FieldStatus.WEB_VERIFIED -> {
            Tuple5(
                Blue950.copy(alpha = 0.8f),
                Blue400,
                Blue400.copy(alpha = 0.3f),
                Icons.Rounded.Public,
                "WEB VERIFIED"
            )
        }
        FieldStatus.UNCERTAIN -> {
            Tuple5(
                Amber950.copy(alpha = 0.8f),
                Amber400,
                Amber400.copy(alpha = 0.3f),
                Icons.Rounded.HelpOutline,
                "UNCERTAIN"
            )
        }
        FieldStatus.NOT_MENTIONED -> {
            Tuple5(
                Zinc900.copy(alpha = 0.8f),
                Zinc400,
                Zinc800,
                Icons.Rounded.RemoveCircleOutline,
                "NOT MENTIONED"
            )
        }
    }

    Box(
        modifier = modifier
            .background(bgColor, RoundedCornerShape(100.dp))
            .border(1.dp, borderColor, RoundedCornerShape(100.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = textColor,
                modifier = Modifier.size(12.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = label,
                color = textColor,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }
    }
}

private data class Tuple5<A, B, C, D, E>(
    val a: A, val b: B, val c: C, val d: D, val e: E
)
