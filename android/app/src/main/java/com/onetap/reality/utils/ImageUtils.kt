package com.onetap.reality.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.InputStream
import kotlin.math.max

object ImageUtils {

    suspend fun uriToBase64DataUri(context: Context, uri: Uri, maxDimension: Int = 1600): String? =
        withContext(Dispatchers.IO) {
            try {
                val input: InputStream? = context.contentResolver.openInputStream(uri)
                val originalBitmap = BitmapFactory.decodeStream(input)
                input?.close()
                if (originalBitmap == null) return@withContext null

                // Correct EXIF orientation
                val exifStream = context.contentResolver.openInputStream(uri)
                val exif = exifStream?.let { ExifInterface(it) }
                val orientation = exif?.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                ) ?: ExifInterface.ORIENTATION_NORMAL
                exifStream?.close()

                val matrix = Matrix()
                when (orientation) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                    ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                    ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                }

                // Scale down to maxDimension
                val width = originalBitmap.width
                val height = originalBitmap.height
                val maxSide = max(width, height)
                val scale = if (maxSide > maxDimension) maxDimension.toFloat() / maxSide else 1.0f
                matrix.postScale(scale, scale)

                val scaledBitmap = Bitmap.createBitmap(
                    originalBitmap,
                    0,
                    0,
                    width,
                    height,
                    matrix,
                    true
                )

                val outputStream = ByteArrayOutputStream()
                scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
                val byteArray = outputStream.toByteArray()
                outputStream.close()

                val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
                "data:image/jpeg;base64,$base64String"
            } catch (_: Exception) {
                null
            }
        }

    suspend fun bitmapToBase64DataUri(bitmap: Bitmap, maxDimension: Int = 1600): String =
        withContext(Dispatchers.IO) {
            val width = bitmap.width
            val height = bitmap.height
            val maxSide = max(width, height)
            val scale = if (maxSide > maxDimension) maxDimension.toFloat() / maxSide else 1.0f

            val scaledBitmap = if (scale < 1.0f) {
                Bitmap.createScaledBitmap(
                    bitmap,
                    (width * scale).toInt(),
                    (height * scale).toInt(),
                    true
                )
            } else {
                bitmap
            }

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val byteArray = outputStream.toByteArray()
            outputStream.close()

            val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            "data:image/jpeg;base64,$base64String"
        }

    suspend fun createThumbnail(bitmap: Bitmap, maxDimension: Int = 300): String =
        withContext(Dispatchers.IO) {
            val width = bitmap.width
            val height = bitmap.height
            val maxSide = max(width, height)
            val scale = if (maxSide > maxDimension) maxDimension.toFloat() / maxSide else 1.0f

            val scaledBitmap = Bitmap.createScaledBitmap(
                bitmap,
                (width * scale).toInt(),
                (height * scale).toInt(),
                true
            )

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 70, outputStream)
            val byteArray = outputStream.toByteArray()
            outputStream.close()

            val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            "data:image/jpeg;base64,$base64String"
        }
}
