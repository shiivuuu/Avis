package com.avis.assistant.camera

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import android.util.Log
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraManager(private val context: Context) {

    private val tag = "AvisCameraManager"

    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: Camera? = null
    private var imageCapture: ImageCapture? = null
    private var imageAnalysis: ImageAnalysis? = null
    private val analysisExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    var isRunning: Boolean = false
        private set

    /**
     * Binds CameraX Preview, Analysis, and ImageCapture to the given lifecycle owner.
     */
    fun startCamera(
        lifecycleOwner: LifecycleOwner,
        previewView: PreviewView?,
        onFrameAnalysis: ((ImageProxy) -> Unit)?,
        onStarted: () -> Unit,
        onError: (String) -> Unit
    ) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                val provider = cameraProvider ?: run {
                    onError("Camera provider initialization returned null.")
                    return@addListener
                }

                provider.unbindAll()

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                // 1. Preview
                val preview = Preview.Builder().build().also {
                    previewView?.let { pv ->
                        it.surfaceProvider = pv.surfaceProvider
                    }
                }

                // 2. ImageCapture for document reading / cloud vision snapshots
                imageCapture = ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .build()

                // 3. ImageAnalysis with STRATEGY_KEEP_ONLY_LATEST to avoid stalling
                val useCases = mutableListOf(preview, imageCapture!!)

                if (onFrameAnalysis != null) {
                    val analysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
                        .build()
                        .also {
                            it.setAnalyzer(analysisExecutor) { imageProxy ->
                                onFrameAnalysis(imageProxy)
                            }
                        }
                    imageAnalysis = analysis
                    useCases.add(analysis)
                }

                // Bind to lifecycle
                camera = provider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    *useCases.toTypedArray()
                )

                isRunning = true
                Log.i(tag, "Camera successfully bound and started.")
                onStarted()

            } catch (e: Exception) {
                Log.e(tag, "Failed to bind camera use cases: ${e.message}", e)
                isRunning = false
                onError("Failed to start camera: ${e.localizedMessage ?: "Unknown hardware error"}")
            }
        }, ContextCompat.getMainExecutor(context))
    }

    /**
     * Stops the camera and unbinds all active use cases.
     */
    fun stopCamera() {
        try {
            cameraProvider?.unbindAll()
            camera = null
            imageAnalysis = null
            isRunning = false
            Log.i(tag, "Camera stopped and use cases unbound.")
        } catch (e: Exception) {
            Log.w(tag, "Error stopping camera: ${e.message}")
        }
    }

    /**
     * Captures a still bitmap for Document Mode or AI Assistant.
     */
    fun captureStillBitmap(
        onSuccess: (Bitmap) -> Unit,
        onError: (String) -> Unit
    ) {
        val capture = imageCapture ?: run {
            onError("Camera capture is not active. Please start camera first.")
            return
        }

        capture.takePicture(
            ContextCompat.getMainExecutor(context),
            object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(image: ImageProxy) {
                    try {
                        val rotation = image.imageInfo.rotationDegrees
                        val bitmap = imageProxyToBitmap(image)
                        val rotatedBitmap = if (rotation != 0) {
                            val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
                            Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                        } else {
                            bitmap
                        }
                        onSuccess(rotatedBitmap)
                    } catch (e: Exception) {
                        Log.e(tag, "Error converting captured image: ${e.message}", e)
                        onError("Failed to process captured photo: ${e.localizedMessage}")
                    } finally {
                        image.close()
                    }
                }

                override fun onError(exception: ImageCaptureException) {
                    Log.e(tag, "Photo capture failed: ${exception.message}", exception)
                    onError("Capture failed: ${exception.localizedMessage}")
                }
            }
        )
    }

    private fun imageProxyToBitmap(image: ImageProxy): Bitmap {
        return if (image.format == ImageFormat.JPEG) {
            val buffer = image.planes[0].buffer
            val bytes = ByteArray(buffer.remaining())
            buffer.get(bytes)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: throw IllegalStateException("Could not decode JPEG bytes into bitmap")
        } else {
            // YUV_420_888 fallback conversion
            val yBuffer = image.planes[0].buffer
            val uBuffer = image.planes[1].buffer
            val vBuffer = image.planes[2].buffer

            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()

            val nv21 = ByteArray(ySize + uSize + vSize)
            yBuffer.get(nv21, 0, ySize)
            vBuffer.get(nv21, ySize, vSize)
            uBuffer.get(nv21, ySize + vSize, uSize)

            val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)
            val out = ByteArrayOutputStream()
            yuvImage.compressToJpeg(Rect(0, 0, image.width, image.height), 90, out)
            val imageBytes = out.toByteArray()
            BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
                ?: throw IllegalStateException("Could not decode YUV bytes into bitmap")
        }
    }

    fun release() {
        stopCamera()
        analysisExecutor.shutdown()
    }
}
