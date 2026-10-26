package com.avis.assistant.model

import android.graphics.Rect

/**
 * Directional zones in the user's forward field of view.
 */
enum class SpatialDirection(val label: String) {
    LEFT("Left"),
    CENTER("Ahead"),
    RIGHT("Right")
}

/**
 * Represents a detected obstacle or feature with directional metadata.
 * Note: generic 2D bounding boxes do not represent physical depth or guarantee overhead hazard detection.
 */
data class SpatialCue(
    val id: Int,
    val label: String,
    val direction: SpatialDirection,
    val confidence: Float,
    val boundingBox: Rect,
    val frameWidth: Int,
    val frameHeight: Int,
    val timestamp: Long = System.currentTimeMillis()
) {
    /**
     * Spoken message for screen readers or Text-To-Speech.
     */
    val speechAnnouncement: String
        get() = when (direction) {
            SpatialDirection.CENTER -> "$label directly ahead"
            SpatialDirection.LEFT -> "$label on your left"
            SpatialDirection.RIGHT -> "$label on your right"
        }
}
