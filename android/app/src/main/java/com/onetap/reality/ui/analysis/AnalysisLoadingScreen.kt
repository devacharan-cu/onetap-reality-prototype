package com.onetap.reality.ui.analysis

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Sparkles
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onetap.reality.ui.components.SecondaryButton
import com.onetap.reality.ui.theme.Emerald400
import com.onetap.reality.ui.theme.Emerald500
import com.onetap.reality.ui.theme.PureWhite
import com.onetap.reality.ui.theme.Zinc400
import com.onetap.reality.ui.theme.Zinc800
import com.onetap.reality.ui.theme.Zinc950
import kotlinx.coroutines.delay

@Composable
fun AnalysisLoadingScreen(
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    val steps = listOf(
        "Understanding visual scene...",
        "Extracting verbatim evidence...",
        "Verifying entities & numbers...",
        "Checking against hallucinations...",
        "Synthesizing verified actions..."
    )

    var currentStepIndex by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1200)
            currentStepIndex = (currentStepIndex + 1) % steps.size
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Zinc950)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterVertically,
            verticalArrangement = Arrangement.Center
        ) {
            // Pulsing Hologram / AI Core
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(140.dp)
            ) {
                // Expanding ring
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .scale(pulseScale)
                        .clip(CircleShape)
                        .background(Emerald500.copy(alpha = pulseAlpha))
                        .border(1.dp, Emerald400.copy(alpha = pulseAlpha * 2), CircleShape)
                )

                // Inner core with OneTap Mark
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(Zinc900)
                        .border(1.5.dp, Emerald400.copy(alpha = 0.8f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = androidx.compose.ui.res.painterResource(id = com.onetap.reality.R.drawable.ic_onetap_mark),
                        contentDescription = "OneTap Processing",
                        tint = PureWhite,
                        modifier = Modifier.size(34.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Brand Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .background(Zinc950, RoundedCornerShape(100.dp))
                    .border(1.dp, Zinc800, RoundedCornerShape(100.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Emerald500)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "ONE-TAP MULTIMODAL PERCEPTION",
                    color = Zinc400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Dynamic Step Text
            Text(
                text = steps[currentStepIndex],
                color = PureWhite,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = (-0.2).sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Applying hard server-side evidence verification layer",
                color = Zinc400,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Cancel Button
            SecondaryButton(
                text = "Cancel Analysis",
                onClick = onCancel,
                modifier = Modifier.width(200.dp)
            )
        }
    }
}
