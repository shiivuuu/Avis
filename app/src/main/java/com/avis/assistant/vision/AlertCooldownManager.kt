package com.avis.assistant.vision

import com.avis.assistant.model.SpatialCue
import com.avis.assistant.model.SpatialDirection
import java.util.concurrent.ConcurrentHashMap

/**
 * Manages cooldown intervals and alert throttling for directional navigation cues.
 * Prevents overwhelming blind users with repetitive announcements.
 */
class AlertCooldownManager(
    private val defaultCooldownMs: Long = 3000L,
    private val urgentCenterCooldownMs: Long = 2000L
) {
    // Stores last alert timestamp for each spatial direction
    private val lastZoneAlertTimestamps = ConcurrentHashMap<SpatialDirection, Long>()

    // Stores last alert timestamp for specific object labels
    private val lastLabelAlertTimestamps = ConcurrentHashMap<String, Long>()

    /**
     * Determines whether a spatial cue should be announced now.
     * If eligible, records the timestamp and returns the formatted spoken announcement.
     * Returns null if throttled by cooldown.
     */
    fun evaluateCue(cue: SpatialCue, now: Long = System.currentTimeMillis()): String? {
        val cooldown = if (cue.direction == SpatialDirection.CENTER) {
            urgentCenterCooldownMs
        } else {
            defaultCooldownMs
        }

        val lastZoneTime = lastZoneAlertTimestamps[cue.direction]
        if (lastZoneTime != null && (now - lastZoneTime < cooldown)) {
            return null
        }

        val lastLabelTime = lastLabelAlertTimestamps[cue.label]
        if (lastLabelTime != null && (now - lastLabelTime < cooldown)) {
            return null
        }

        // Passed cooldown checks: record timestamps
        lastZoneAlertTimestamps[cue.direction] = now
        lastLabelAlertTimestamps[cue.label] = now

        return formatSpokenAlert(cue)
    }

    /**
     * Selects the highest priority cue among active detections:
     * Priority: CENTER > LEFT / RIGHT, weighted by confidence.
     */
    fun selectPriorityCue(cues: List<SpatialCue>): SpatialCue? {
        if (cues.isEmpty()) return null

        val centerCues = cues.filter { it.direction == SpatialDirection.CENTER }
        if (centerCues.isNotEmpty()) {
            return centerCues.maxByOrNull { it.confidence }
        }

        return cues.maxByOrNull { it.confidence }
    }

    private fun formatSpokenAlert(cue: SpatialCue): String {
        val friendlyLabel = when (cue.label.lowercase()) {
            "fashion goods" -> "Object"
            "home good" -> "Furniture"
            "food" -> "Item"
            "place" -> "Structure"
            "plant" -> "Plant obstacle"
            else -> cue.label.replaceFirstChar { it.uppercase() }
        }

        return when (cue.direction) {
            SpatialDirection.CENTER -> "$friendlyLabel directly ahead"
            SpatialDirection.LEFT -> "$friendlyLabel on your left"
            SpatialDirection.RIGHT -> "$friendlyLabel on your right"
        }
    }

    fun reset() {
        lastZoneAlertTimestamps.clear()
        lastLabelAlertTimestamps.clear()
    }
}
