package com.onetap.reality.ui.home

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Layers
import androidx.compose.material.icons.rounded.PermIdentity
import androidx.compose.material.icons.rounded.PhotoLibrary
import androidx.compose.material.icons.rounded.Receipt
import androidx.compose.material.icons.rounded.Sell
import androidx.compose.material.icons.rounded.Sparkles
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.onetap.reality.domain.model.CanonicalResult
import com.onetap.reality.ui.components.AppTopBar
import com.onetap.reality.ui.components.GlassCard
import com.onetap.reality.ui.history.HistorySheet
import com.onetap.reality.ui.history.HistoryViewModel
import com.onetap.reality.ui.theme.Emerald400
import com.onetap.reality.ui.theme.Emerald500
import com.onetap.reality.ui.theme.Emerald600
import com.onetap.reality.ui.theme.Emerald950
import com.onetap.reality.ui.theme.PureBlack
import com.onetap.reality.ui.theme.PureWhite
import com.onetap.reality.ui.theme.Zinc400
import com.onetap.reality.ui.theme.Zinc800
import com.onetap.reality.ui.theme.Zinc900
import com.onetap.reality.ui.theme.Zinc950
import com.onetap.reality.utils.NetworkConfig

@Composable
fun HomeScreen(
    onOpenPointAndCapture: () -> Unit,
    onResultSelected: (CanonicalResult) -> Unit,
    homeViewModel: HomeViewModel,
    historyViewModel: HistoryViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isSettingsOpen by homeViewModel.isSettingsOpen.collectAsState()
    val isHistoryOpen by homeViewModel.isHistoryOpen.collectAsState()
    val historyItems by historyViewModel.historyItems.collectAsState()

    var showPermissionRationale by remember { mutableStateOf(false) }

    // Camera Permission Launcher
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            onOpenPointAndCapture()
        } else {
            showPermissionRationale = true
        }
    }

    // Modern Photo Picker Launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            homeViewModel.analyzeFromGalleryUri(context, uri)
        }
    }

    // Permission Rationale Dialog
    if (showPermissionRationale) {
        AlertDialog(
            onDismissRequest = { showPermissionRationale = false },
            title = { Text("Camera Access Required", color = PureWhite, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "OneTap Reality needs camera access to capture posters, receipts, and scenes for instant multimodal AI verification.",
                    color = Zinc400
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showPermissionRationale = false
                        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = PureBlack)
                ) {
                    Text("Grant Permission", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showPermissionRationale = false }) {
                    Text("Cancel", color = PureWhite)
                }
            },
            containerColor = Zinc900,
            shape = RoundedCornerShape(18.dp)
        )
    }

    // Settings / API Host Dialog
    if (isSettingsOpen) {
        var hostUrl by remember { mutableStateOf(NetworkConfig.getBaseUrl(context)) }
        AlertDialog(
            onDismissRequest = { homeViewModel.closeSettings() },
            title = { Text("AI Server Configuration", color = PureWhite, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        "Set the OneTap Reality backend URL.\n• Android Emulator: http://10.0.2.2:3001\n• Physical Device: http://192.168.x.x:3001",
                        color = Zinc400,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    OutlinedTextField(
                        value = hostUrl,
                        onValueChange = { hostUrl = it },
                        label = { Text("Base API URL") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = PureWhite,
                            unfocusedTextColor = PureWhite,
                            focusedBorderColor = Emerald500,
                            unfocusedBorderColor = Zinc800
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        NetworkConfig.setBaseUrl(context, hostUrl.trim())
                        homeViewModel.closeSettings()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = PureBlack)
                ) {
                    Text("Save", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { homeViewModel.closeSettings() }) {
                    Text("Cancel", color = PureWhite)
                }
            },
            containerColor = Zinc900,
            shape = RoundedCornerShape(18.dp)
        )
    }

    // History Bottom Sheet
    if (isHistoryOpen) {
        HistorySheet(
            viewModel = historyViewModel,
            onSelectScan = {
                homeViewModel.selectHistoryResult(it)
                onResultSelected(it)
            },
            onDismiss = { homeViewModel.closeHistory() }
        )
    }

    Scaffold(
        topBar = {
            AppTopBar(
                onOpenHistory = { homeViewModel.openHistory() },
                onOpenSettings = { homeViewModel.openSettings() }
            )
        },
        containerColor = Zinc950
    ) { paddingValues ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(4.dp))

                // Hero Headline
                Text(
                    text = "See. Understand.\nVerify. Act.",
                    color = PureWhite,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 38.sp,
                    letterSpacing = (-0.8).sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Point your camera at any poster, menu, or receipt. Turn verified visual reality into instant actions with zero hallucinations.",
                    color = Zinc400,
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }

            // PRIMARY ACTION: Point & Capture
            item {
                Spacer(modifier = Modifier.height(8.dp))

                val gradient = Brush.linearGradient(listOf(Emerald500, Emerald600))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .background(gradient)
                        .clickable {
                            val permission = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
                            if (permission == PackageManager.PERMISSION_GRANTED) {
                                onOpenPointAndCapture()
                            } else {
                                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                            }
                        }
                        .padding(22.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(PureBlack.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.CameraAlt,
                                        contentDescription = null,
                                        tint = PureBlack,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Point & Capture",
                                    color = PureBlack,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "Live mirrored viewfinder with real-time AI perception",
                                color = PureBlack.copy(alpha = 0.75f),
                                fontSize = 13.sp,
                                lineHeight = 18.sp
                            )
                        }

                        Icon(
                            imageVector = Icons.Rounded.ChevronRight,
                            contentDescription = null,
                            tint = PureBlack,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }

            // SECONDARY ACTION: Choose from Gallery
            item {
                GlassCard(
                    onClick = {
                        photoPickerLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Zinc950)
                                    .border(1.dp, Zinc800, RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.PhotoLibrary,
                                    contentDescription = null,
                                    tint = PureWhite,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Text(
                                    text = "Choose from Gallery",
                                    color = PureWhite,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Analyze saved photos or screenshots",
                                    color = Zinc400,
                                    fontSize = 12.sp
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.Rounded.ChevronRight,
                            contentDescription = null,
                            tint = Zinc400,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }

            // Quick Demo Examples
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "TRY AN EXAMPLE",
                    color = Zinc400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )

                Spacer(modifier = Modifier.height(10.dp))

                val examples = listOf(
                    DemoItem("Event Poster", "Art Fair · Free Entry", Icons.Rounded.CalendarMonth),
                    DemoItem("Business Card", "AI Architect · Contact", Icons.Rounded.PermIdentity),
                    DemoItem("Coffee Receipt", "Line Items · Total $25.53", Icons.Rounded.Receipt),
                    DemoItem("Bistro Menu", "Dishes & Prices", Icons.Rounded.Layers),
                    DemoItem("Product Box", "Specs & Warranty", Icons.Rounded.Sell)
                )

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(examples) { ex ->
                        Box(
                            modifier = Modifier
                                .width(150.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Zinc900)
                                .border(1.dp, Zinc800, RoundedCornerShape(16.dp))
                                .clickable {
                                    // Trigger gallery / camera with sample
                                    onOpenPointAndCapture()
                                }
                                .padding(14.dp)
                        ) {
                            Column {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Emerald950)
                                        .border(1.dp, Emerald400.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = ex.icon,
                                        contentDescription = null,
                                        tint = Emerald400,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = ex.title,
                                    color = PureWhite,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = ex.subtitle,
                                    color = Zinc400,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }

            // Recent Scans Section (if available)
            if (historyItems.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "RECENT SCANS",
                            color = Zinc400,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )

                        Text(
                            text = "View All (${historyItems.size})",
                            color = Emerald400,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.clickable { homeViewModel.openHistory() }
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    val topItem = historyItems.first()
                    GlassCard(
                        onClick = {
                            homeViewModel.selectHistoryResult(topItem.result)
                            onResultSelected(topItem.result)
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = topItem.title,
                                    color = PureWhite,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = topItem.summary,
                                    color = Zinc400,
                                    fontSize = 12.sp,
                                    maxLines = 1
                                )
                            }

                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = null,
                                tint = Zinc400
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(40.dp))
            }
        }
    }
}

private data class DemoItem(val title: String, val subtitle: String, val icon: ImageVector)
