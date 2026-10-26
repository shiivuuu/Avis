package com.avis.assistant.vision

import android.annotation.SuppressLint
import android.graphics.Rect
import android.util.Log
import androidx.camera.core.ImageProxy
import com.avis.assistant.model.SpatialCue
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.DetectedObject
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.ObjectDetector
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions

/**
 * On-device real-time object detector utilizing Google ML Kit Object Detection.
 * Runs 100% locally on the device without network dependency.
 */
class ObjectDetectorManager {

    private val tag = "AvisObjectDetector"
    private val detector: ObjectDetector

    init {
        val options = ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.STREAM_MODE)
            .enableClassification()
            .enableMultipleObjects()
            .build()
        detector = ObjectDetection.getClient(options)
        Log.i(tag, "ML Kit Object Detector initialized in STREAM_MODE with classification")
    }

    /**
     * Analyzes a single ImageProxy frame from CameraX.
     * Guaranteed to close imageProxy on either success or failure.
     */
    @SuppressLint("UnsafeOptInUsageError")
    fun processImage(
        imageProxy: ImageProxy,
        onSuccess: (List<SpatialCue>) -> Unit,
        onError: (Exception) -> Unit
    ) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            onError(IllegalStateException("ImageProxy contained null mediaImage"))
            return
        }

        val rotationDegrees = imageProxy.imageInfo.rotationDegrees
        val inputImage = InputImage.fromMediaImage(mediaImage, rotationDegrees)

        // When rotated 90 or 270 degrees, effective frame width and height swap
        val effectiveWidth = if (rotationDegrees == 90 || rotationDegrees == 270) {
            imageProxy.height
        } else {
            imageProxy.width
        }
        val effectiveHeight = if (rotationDegrees == 90 || rotationDegrees == 270) {
            imageProxy.width
        } else {
            imageProxy.height
        }

        detector.process(inputImage)
            .addOnSuccessListener { detectedObjects ->
                val cues = mapToSpatialCues(detectedObjects, effectiveWidth, effectiveHeight)
                onSuccess(cues)
            }
            .addOnFailureListener { exception ->
                Log.e(tag, "Detection error: ${exception.message}", exception)
                onError(exception)
            }
            .addOnCompleteListener {
                // Ensure ImageProxy is unconditionally closed to maintain buffer flow
                imageProxy.close()
            }
    }

    private fun mapToSpatialCues(
        detectedObjects: List<DetectedObject>,
        frameWidth: Int,
        frameHeight: Int
    ): List<SpatialCue> {
        return detectedObjects.mapNotNull { obj ->
            val box = obj.boundingBox

            if (!DirectionCalculator.isSignificantObstacle(box, frameWidth, frameHeight)) {
                return@mapNotNull null
            }

            val direction = DirectionCalculator.calculateDirection(box, frameWidth, frameHeight)
            val primaryLabel = obj.labels.maxByOrNull { it.confidence }
            val labelText = primaryLabel?.text ?: "Obstacle"
            val confidence = primaryLabel?.confidence ?: 0.5f

            SpatialCue(
                id = obj.trackingId ?: box.hashCode(),
                label = labelText,
                direction = direction,
                confidence = confidence,
                boundingBox = box,
                frameWidth = frameWidth,
                frameHeight = frameHeight
            )
        }
    }

    fun release() {
        try {
            detector.close()
            Log.i(tag, "ML Kit Object Detector released")
        } catch (e: Exception) {
            Log.w(tag, "Error closing Object Detector: ${e.message}")
        }
    }
}
