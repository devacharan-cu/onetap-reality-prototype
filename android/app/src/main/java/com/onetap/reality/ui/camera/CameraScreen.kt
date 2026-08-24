package com.onetap.reality.ui.camera

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Cameraswitch
import androidx.compose.material.icons.rounded.FlashOff
import androidx.compose.material.icons.rounded.FlashOn
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.onetap.reality.ui.theme.Emerald500
import com.onetap.reality.ui.theme.PureBlack
import com.onetap.reality.ui.theme.PureWhite
import com.onetap.reality.ui.theme.Zinc800
import com.onetap.reality.ui.theme.Zinc900

@Composable
fun CameraScreen(
    onImageCaptured: (base64DataUri: String, thumbnailBase64: String) -> Unit,
    onClose: () -> Unit,
    viewModel: CameraViewModel = viewModel()
) {
    val context = LocalContext.current
    val lensFacing by viewModel.lensFacing.collectAsState()
    val isTorchOn by viewModel.isTorchOn.collectAsState()
    val hasFlashUnit by viewModel.hasFlashUnit.collectAsState()
    val isCapturing by viewModel.isCapturing.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PureBlack)
    ) {
        // 1. Fullscreen CameraX Live Preview (Mirrored for Front Cam)
        CameraPreview(
            lensFacing = lensFacing,
            isTorchOn = isTorchOn,
            onCameraInitialized = { capture, camera ->
                viewModel.onCameraInitialized(capture, camera)
            },
            modifier = Modifier.fillMaxSize()
        )

        // 2. Top Controls (Close, Flash, Camera Switch)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 44.dp, start = 20.dp, end = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Close Button
            IconButton(
                onClick = onClose,
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Zinc900.copy(alpha = 0.75f))
                    .border(1.dp, Zinc800, CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Close,
                    contentDescription = "Close Camera",
                    tint = PureWhite
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Torch Button (if flash unit supported)
                if (hasFlashUnit) {
                    IconButton(
                        onClick = { viewModel.toggleTorch() },
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(if (isTorchOn) Emerald500 else Zinc900.copy(alpha = 0.75f))
                            .border(1.dp, Zinc800, CircleShape)
                    ) {
                        Icon(
                            imageVector = if (isTorchOn) Icons.Rounded.FlashOn else Icons.Rounded.FlashOff,
                            contentDescription = "Toggle Torch",
                            tint = if (isTorchOn) PureBlack else PureWhite
                        )
                    }
                }

                // Switch Camera Facing Button
                IconButton(
                    onClick = { viewModel.toggleCameraFacing() },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Zinc900.copy(alpha = 0.75f))
                        .border(1.dp, Zinc800, CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Cameraswitch,
                        contentDescription = "Switch Camera",
                        tint = PureWhite
                    )
                }
            }
        }

        // 3. Bottom Capture Shutter Button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(bottom = 50.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .border(4.dp, PureWhite, CircleShape)
                    .padding(6.dp)
                    .clip(CircleShape)
                    .background(if (isCapturing) Emerald500.copy(alpha = 0.5f) else Emerald500)
                    .clickable(enabled = !isCapturing) {
                        viewModel.capturePhoto(
                            executor = ContextCompat.getMainExecutor(context),
                            onCaptured = onImageCaptured,
                            onError = { /* Log or Toast */ }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                if (isCapturing) {
                    CircularProgressIndicator(
                        color = PureBlack,
                        modifier = Modifier.size(30.dp),
                        strokeWidth = 3.dp
                    )
                }
            }
        }
    }
}
