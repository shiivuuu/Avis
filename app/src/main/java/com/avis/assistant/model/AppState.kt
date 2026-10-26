package com.avis.assistant.model

import android.graphics.Bitmap

/**
 * Operating modes of Avis assistant.
 */
enum class AppMode(val title: String, val description: String) {
    NAVIGATION("Navigation", "Real-time spatial obstacle and path awareness"),
    DOCUMENT("Document Reader", "Capture and read printed or digital text aloud"),
    ASSISTANT("AI Assistant", "Ask specific questions about your visual environment")
}

data class NavigationState(
    val isNavigating: Boolean = false,
    val activeCues: List<SpatialCue> = emptyList(),
    val lastAnnouncement: String = "Navigation idle. Tap Start Navigation to begin.",
    val cameraActive: Boolean = false,
    val fps: Int = 0,
    val warningMessage: String? = null
)

data class DocumentState(
    val capturedImage: Bitmap? = null,
    val recognizedText: String = "",
    val isProcessing: Boolean = false,
    val isReadingAloud: Boolean = false,
    val statusMessage: String = "Align text within camera view and tap Capture to read."
)

data class AssistantState(
    val queryText: String = "",
    val isListening: Boolean = false,
    val isProcessing: Boolean = false,
    val responseText: String = "",
    val backendAvailable: Boolean = false,
    val statusMessage: String = "Speak or enter your question about what is in front of you."
)
