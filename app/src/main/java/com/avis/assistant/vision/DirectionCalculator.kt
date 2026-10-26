package com.avis.assistant.vision

import android.graphics.Rect
import com.avis.assistant.model.SpatialDirection

/**
 * Utility for mapping 2D bounding boxes within a camera frame to spatial directional zones.
 *
 * SAFETY NOTICE:
 * Bounding-box position corresponds strictly to angular/horizontal field-of-view within the 2D image.
 * It DOES NOT provide physical 3D distance or depth measurements.
 * Generic on-device object detection DOES NOT guarantee detection of overhead hazards (e.g., low branches,
 * signboards, wires) or negative obstacles (e.g., drop-offs, open pits, downward stairs).
 */
object DirectionCalculator {

    const val LEFT_BOUNDARY_THRESHOLD = 0.35f
    const val RIGHT_BOUNDARY_THRESHOLD = 0.65f
    const val MIN_AREA_FRACTION_THRESHOLD = 0.02f // Filter out tiny, far-away noise

    /**
     * Calculates the spatial direction from horizontal boundaries.
     */
    fun calculateDirection(
        left: Int,
        right: Int,
        frameWidth: Int
    ): SpatialDirection {
        if (frameWidth <= 0) return SpatialDirection.CENTER

        val centerX = (left + right) / 2.0f
        val normalizedX = (centerX / frameWidth).coerceIn(0f, 1f)

        return when {
            normalizedX < LEFT_BOUNDARY_THRESHOLD -> SpatialDirection.LEFT
            normalizedX > RIGHT_BOUNDARY_THRESHOLD -> SpatialDirection.RIGHT
            else -> SpatialDirection.CENTER
        }
    }

    /**
     * Overload for android.graphics.Rect.
     */
    fun calculateDirection(
        boundingBox: Rect,
        frameWidth: Int,
        frameHeight: Int
    ): SpatialDirection {
        return calculateDirection(boundingBox.left, boundingBox.right, frameWidth)
    }

    /**
     * Checks if the detected bounding box is large enough in the field of view to warrant user alert.
     */
    fun isSignificantObstacle(
        left: Int,
        top: Int,
        right: Int,
        bottom: Int,
        frameWidth: Int,
        frameHeight: Int
    ): Boolean {
        if (frameWidth <= 0 || frameHeight <= 0) return false
        val width = (right - left).coerceAtLeast(0)
        val height = (bottom - top).coerceAtLeast(0)
        val boxArea = (width.toFloat() * height.toFloat()).coerceAtLeast(0f)
        val frameArea = (frameWidth.toFloat() * frameHeight.toFloat()).coerceAtLeast(1f)
        val areaFraction = boxArea / frameArea
        return areaFraction >= MIN_AREA_FRACTION_THRESHOLD
    }

    /**
     * Overload for android.graphics.Rect.
     */
    fun isSignificantObstacle(
        boundingBox: Rect,
        frameWidth: Int,
        frameHeight: Int
    ): Boolean {
        return isSignificantObstacle(
            boundingBox.left,
            boundingBox.top,
            boundingBox.right,
            boundingBox.bottom,
            frameWidth,
            frameHeight
        )
    }
}
