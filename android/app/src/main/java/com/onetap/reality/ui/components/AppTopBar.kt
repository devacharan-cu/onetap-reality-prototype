package com.onetap.reality.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.res.painterResource
import com.onetap.reality.R
import com.onetap.reality.ui.theme.Emerald500
import com.onetap.reality.ui.theme.PureWhite
import com.onetap.reality.ui.theme.Zinc400
import com.onetap.reality.ui.theme.Zinc800
import com.onetap.reality.ui.theme.Zinc900
import com.onetap.reality.ui.theme.Zinc950

@Composable
fun AppTopBar(
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // App Logo & Status Indicator
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Zinc900)
                    .border(1.dp, Zinc800, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_onetap_mark),
                    contentDescription = "OneTap Reality Logo",
                    tint = PureWhite,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Text(
                text = "OneTap Reality",
                color = PureWhite,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.3).sp
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // History Icon Button
        IconButton(
            onClick = onOpenHistory,
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(Zinc950)
                .border(1.dp, Zinc800, CircleShape)
        ) {
            Icon(
                imageVector = Icons.Rounded.History,
                contentDescription = "Scan History",
                tint = Zinc400,
                modifier = Modifier.size(18.dp)
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Settings Icon Button
        IconButton(
            onClick = onOpenSettings,
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(Zinc950)
                .border(1.dp, Zinc800, CircleShape)
        ) {
            Icon(
                imageVector = Icons.Rounded.Settings,
                contentDescription = "Settings / API Config",
                tint = Zinc400,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
