package com.avis.assistant.vision

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DocumentOcrTest {

    @Test
    fun testSuccessfulOcrResultFormatting() {
        val ocrResult = DocumentOcrManager.OcrResult(
            fullText = "Avis Assistive Vision\nObstacle detection active",
            blockCount = 2,
            lineCount = 2,
            isSuccessful = true,
            feedbackMessage = "Detected 2 lines across 2 paragraphs."
        )

        assertTrue(ocrResult.isSuccessful)
        assertEquals(2, ocrResult.lineCount)
        assertEquals(2, ocrResult.blockCount)
        assertTrue(ocrResult.fullText.contains("Avis Assistive Vision"))
        assertTrue(ocrResult.feedbackMessage.contains("Detected 2 lines"))
    }

    @Test
    fun testEmptyOrIllegibleOcrResultFeedback() {
        val ocrResult = DocumentOcrManager.OcrResult(
            fullText = "",
            blockCount = 0,
            lineCount = 0,
            isSuccessful = false,
            feedbackMessage = "No legible text detected. Please hold the camera flat, ensure good lighting, and tap Capture again."
        )

        assertFalse(ocrResult.isSuccessful)
        assertEquals(0, ocrResult.lineCount)
        assertTrue(ocrResult.feedbackMessage.contains("No legible text detected"))
    }
}
