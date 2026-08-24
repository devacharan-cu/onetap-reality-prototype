package com.onetap.reality.ui.camera

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onetap.reality.utils.ImageUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.Executor

class CameraViewModel : ViewModel() {

    private val _lensFacing = MutableStateFlow(CameraSelector.LENS_FACING_BACK)
    val lensFacing = _lensFacing.asStateFlow()

    private val _isTorchOn = MutableStateFlow(false)
    val isTorchOn = _isTorchOn.asStateFlow()

    private val _hasFlashUnit = MutableStateFlow(false)
    val hasFlashUnit = _hasFlashUnit.asStateFlow()

    private val _isCapturing = MutableStateFlow(false)
    val isCapturing = _isCapturing.asStateFlow()

    private var imageCapture: ImageCapture? = null
    private var activeCamera: Camera? = null

    fun onCameraInitialized(capture: ImageCapture, camera: Camera?) {
        imageCapture = capture
        activeCamera = camera
        _hasFlashUnit.value = camera?.cameraInfo?.hasFlashUnit() == true
    }

    fun toggleCameraFacing() {
        _lensFacing.value = if (_lensFacing.value == CameraSelector.LENS_FACING_BACK) {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
        _isTorchOn.value = false
    }

    fun toggleTorch() {
        if (_hasFlashUnit.value) {
            val newState = !_isTorchOn.value
            _isTorchOn.value = newState
            activeCamera?.cameraControl?.enableTorch(newState)
        }
    }

    fun capturePhoto(
        executor: Executor,
        onCaptured: (base64DataUri: String, thumbnailBase64: String) -> Unit,
        onError: (String) -> Unit
    ) {
        val capture = imageCapture ?: run {
            onError("Camera capture is not ready")
            return
        }

        _isCapturing.value = true

        capture.takePicture(
            executor,
            object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(imageProxy: ImageProxy) {
                    viewModelScope.launch {
                        try {
                            val rotationDegrees = imageProxy.imageInfo.rotationDegrees
                            val rawBitmap = imageProxy.toBitmap()
                            imageProxy.close()

                            val matrix = Matrix()
                            if (rotationDegrees != 0) {
                                matrix.postRotate(rotationDegrees.toFloat())
                            }

                            // Note: We deliberately do NOT mirror the captured bitmap so Gemini receives normal orientation text
                            val correctedBitmap = if (rotationDegrees != 0) {
                                Bitmap.createBitmap(
                                    rawBitmap,
                                    0,
                                    0,
                                    rawBitmap.width,
                                    rawBitmap.height,
                                    matrix,
                                    true
                                )
                            } else {
                                rawBitmap
                            }

                            val base64DataUri = ImageUtils.bitmapToBase64DataUri(correctedBitmap)
                            val thumbnailBase64 = ImageUtils.createThumbnail(correctedBitmap)

                            _isCapturing.value = false
                            onCaptured(base64DataUri, thumbnailBase64)
                        } catch (e: Exception) {
                            _isCapturing.value = false
                            onError("Failed to process captured photo: ${e.message}")
                        }
                    }
                }

                override fun onError(exception: ImageCaptureException) {
                    _isCapturing.value = false
                    onError("Camera capture failed: ${exception.message}")
                }
            }
        )
    }
}
