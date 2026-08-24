package com.onetap.reality.ui.results

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onetap.reality.domain.model.ExtractedField
import com.onetap.reality.domain.model.FieldStatus
import com.onetap.reality.ui.components.StatusBadge
import com.onetap.reality.ui.theme.Emerald400
import com.onetap.reality.ui.theme.PureWhite
import com.onetap.reality.ui.theme.Zinc400
import com.onetap.reality.ui.theme.Zinc500
import com.onetap.reality.ui.theme.Zinc800
import com.onetap.reality.ui.theme.Zinc900
import com.onetap.reality.ui.theme.Zinc950
import com.onetap.reality.utils.IntentUtils

@Composable
fun FieldEvidenceCard(
    field: ExtractedField,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isExpanded by remember { mutableStateOf(false) }

    val shape = RoundedCornerShape(16.dp)
    val isAbsent = field.status == FieldStatus.NOT_MENTIONED
    val isVerified = field.status == FieldStatus.VERIFIED || field.status == FieldStatus.WEB_VERIFIED

    val cardBg = if (isAbsent) Zinc950.copy(alpha = 0.5f) else Zinc900
    val cardBorder = if (isVerified) Emerald400.copy(alpha = 0.2f) else Zinc800

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(cardBg, shape)
            .border(1.dp, cardBorder, shape)
            .clickable { isExpanded = !isExpanded }
            .padding(16.dp)
    ) {
        Column {
            // Card Header: Field Label & Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = field.label,
                    color = Zinc400,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                StatusBadge(status = field.status)
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Field Value
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isAbsent) "Not mentioned" else field.value,
                    color = if (isAbsent) Zinc500 else PureWhite,
                    fontSize = 15.sp,
                    fontWeight = if (isAbsent) FontWeight.Normal else FontWeight.SemiBold,
                    fontStyle = if (isAbsent) FontStyle.Italic else FontStyle.Normal,
                    modifier = Modifier.weight(1f)
                )

                if (isVerified) {
                    IconButton(
                        onClick = { IntentUtils.copyToClipboard(context, field.value, field.label) },
                        modifier = Modifier.padding(start = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.ContentCopy,
                            contentDescription = "Copy ${field.label}",
                            tint = Zinc400
                        )
                    }
                }
            }

            // Evidence Breakdown Dropdown
            AnimatedVisibility(visible = isExpanded && field.evidence != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Zinc950)
                        .border(1.dp, Zinc800, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = "VERBATIM EVIDENCE:",
                        color = Emerald400,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "“${field.evidence}”",
                        color = Zinc400,
                        fontSize = 12.sp,
                        fontStyle = FontStyle.Italic
                    )
                }
            }
        }
    }
}
