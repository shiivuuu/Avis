package com.avis.assistant.vision

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.util.Log
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

/**
 * On-device document and text reader utilizing Google ML Kit Latin Text Recognition.
 * Fully local and offline capable.
 */
class DocumentOcrManager {

    private val tag = "AvisDocumentOcr"
    private val recognizer: TextRecognizer

    init {
        recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        Log.i(tag, "ML Kit Text Recognizer initialized")
    }

    data class OcrResult(
        val fullText: String,
        val blockCount: Int,
        val lineCount: Int,
        val isSuccessful: Boolean,
        val feedbackMessage: String
    )

    /**
     * Recognizes text from a captured still bitmap.
     */
    fun processBitmap(
        bitmap: Bitmap,
        rotationDegrees: Int = 0,
        onComplete: (OcrResult) -> Unit
    ) {
        val inputImage = InputImage.fromBitmap(bitmap, rotationDegrees)
        recognizer.process(inputImage)
            .addOnSuccessListener { visionText ->
                val result = parseVisionText(visionText)
                onComplete(result)
            }
            .addOnFailureListener { exception ->
                Log.e(tag, "OCR processing failed: ${exception.message}", exception)
                onComplete(
                    OcrResult(
                        fullText = "",
                        blockCount = 0,
                        lineCount = 0,
                        isSuccessful = false,
                        feedbackMessage = "Error processing document image: ${exception.localizedMessage ?: "Unknown error"}"
                    )
                )
            }
    }

    /**
     * Recognizes text from a live camera frame ImageProxy.
     * Guaranteed to close imageProxy on completion.
     */
    @SuppressLint("UnsafeOptInUsageError")
    fun processImageProxy(
        imageProxy: ImageProxy,
        onComplete: (OcrResult) -> Unit
    ) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            onComplete(
                OcrResult(
                    fullText = "",
                    blockCount = 0,
                    lineCount = 0,
                    isSuccessful = false,
                    feedbackMessage = "Camera frame was unavailable for OCR."
                )
            )
            return
        }

        val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        recognizer.process(inputImage)
            .addOnSuccessListener { visionText ->
                val result = parseVisionText(visionText)
                onComplete(result)
            }
            .addOnFailureListener { exception ->
                Log.e(tag, "Live OCR failed: ${exception.message}", exception)
                onComplete(
                    OcrResult(
                        fullText = "",
                        blockCount = 0,
                        lineCount = 0,
                        isSuccessful = false,
                        feedbackMessage = "OCR processing failed: ${exception.localizedMessage}"
                    )
                )
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    }

    private fun parseVisionText(visionText: Text): OcrResult {
        val rawText = visionText.text.trim()
        val blocks = visionText.textBlocks

        var totalLines = 0
        for (block in blocks) {
            totalLines += block.lines.size
        }

        if (rawText.isBlank()) {
            return OcrResult(
                fullText = "",
                blockCount = 0,
                lineCount = 0,
                isSuccessful = false,
                feedbackMessage = "No legible text detected. Please hold the camera flat, ensure good lighting, and tap Capture again."
            )
        }

        val feedback = "Detected $totalLines lines across ${blocks.size} paragraphs."

        return OcrResult(
            fullText = rawText,
            blockCount = blocks.size,
            lineCount = totalLines,
            isSuccessful = true,
            feedbackMessage = feedback
        )
    }

    fun release() {
        try {
            recognizer.close()
            Log.i(tag, "ML Kit Text Recognizer closed")
        } catch (e: Exception) {
            Log.w(tag, "Error closing Text Recognizer: ${e.message}")
        }
    }
}
