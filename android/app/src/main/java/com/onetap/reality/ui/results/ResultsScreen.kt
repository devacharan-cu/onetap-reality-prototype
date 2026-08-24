package com.onetap.reality.ui.results

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.ChatBubbleOutline
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Sparkles
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.domain.model.FieldStatus
import com.onetap.reality.ui.chat.ChatBottomSheet
import com.onetap.reality.ui.chat.ChatViewModel
import com.onetap.reality.ui.components.PrimaryButton
import com.onetap.reality.ui.components.SecondaryButton
import com.onetap.reality.ui.theme.Emerald400
import com.onetap.reality.ui.theme.Emerald500
import com.onetap.reality.ui.theme.Emerald950
import com.onetap.reality.ui.theme.PureBlack
import com.onetap.reality.ui.theme.PureWhite
import com.onetap.reality.ui.theme.Zinc400
import com.onetap.reality.ui.theme.Zinc800
import com.onetap.reality.ui.theme.Zinc900
import com.onetap.reality.ui.theme.Zinc950
import com.onetap.reality.utils.IntentUtils

@Composable
fun ResultsScreen(
    result: CanonicalResult,
    onScanAgain: () -> Unit,
    resultsViewModel: ResultsViewModel,
    chatViewModel: ChatViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isChatOpen by resultsViewModel.isChatOpen.collectAsState()

    val verifiedCount = result.fields.values.count {
        it.status == FieldStatus.VERIFIED || it.status == FieldStatus.WEB_VERIFIED
    }
    val absentCount = result.fields.values.count {
        it.status == FieldStatus.NOT_MENTIONED
    }

    if (isChatOpen) {
        ChatBottomSheet(
            result = result,
            viewModel = chatViewModel,
            onDismiss = { resultsViewModel.closeChat() }
        )
    }

    Scaffold(
        containerColor = Zinc950,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { resultsViewModel.openChat() },
                containerColor = Emerald500,
                contentColor = PureBlack,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.ChatBubbleOutline,
                        contentDescription = "Ask AI",
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Ask AI",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))

                // Top Navigation Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onScanAgain,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Zinc900)
                            .border(1.dp, Zinc800, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.ArrowBack,
                            contentDescription = "Back / Scan Again",
                            tint = PureWhite
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .background(Zinc900, RoundedCornerShape(100.dp))
                            .border(1.dp, Zinc800, RoundedCornerShape(100.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(Emerald500)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = result.context.replace("_", " ").uppercase(),
                            color = Emerald400,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    IconButton(
                        onClick = { IntentUtils.shareResult(context, result) },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Zinc900)
                            .border(1.dp, Zinc800, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Share,
                            contentDescription = "Share",
                            tint = PureWhite
                        )
                    }
                }
            }

            // Title & Subject Card
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(Zinc900)
                        .border(1.dp, Zinc800, RoundedCornerShape(20.dp))
                        .padding(20.dp)
                ) {
                    Text(
                        text = result.title,
                        color = PureWhite,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.4).sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = result.summary,
                        color = Zinc400,
                        fontSize = 14.sp,
                        lineHeight = 20.sp
                    )

                    if (!result.keyTakeaway.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Emerald950.copy(alpha = 0.5f))
                                .border(1.dp, Emerald400.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Row(verticalAlignment = Alignment.Top) {
                                Icon(
                                    imageVector = Icons.Rounded.Sparkles,
                                    contentDescription = null,
                                    tint = Emerald400,
                                    modifier = Modifier
                                        .size(16.dp)
                                        .padding(top = 2.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = result.keyTakeaway,
                                    color = Emerald400,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }
            }

            // Actions Section
            item {
                ActionButtonsSection(result = result)
            }

            // Evidence Header & Count Badges
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "FIELD EVIDENCE & VERIFICATION",
                        color = Zinc400,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            modifier = Modifier
                                .background(Emerald950, RoundedCornerShape(100.dp))
                                .border(1.dp, Emerald400.copy(alpha = 0.3f), RoundedCornerShape(100.dp))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "$verifiedCount Verified",
                                color = Emerald400,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (absentCount > 0) {
                            Box(
                                modifier = Modifier
                                    .background(Zinc900, RoundedCornerShape(100.dp))
                                    .border(1.dp, Zinc800, RoundedCornerShape(100.dp))
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "$absentCount Absent",
                                    color = Zinc400,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            // Verified Fields List
            items(result.fields.values.toList(), key = { it.key }) { field ->
                FieldEvidenceCard(field = field)
            }

            // Scan Again Button at the bottom
            item {
                Spacer(modifier = Modifier.height(16.dp))
                SecondaryButton(
                    text = "Scan Again",
                    icon = Icons.Rounded.Refresh,
                    onClick = onScanAgain,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}
