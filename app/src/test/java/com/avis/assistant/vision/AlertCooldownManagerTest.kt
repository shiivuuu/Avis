package com.avis.assistant.vision

import android.graphics.Rect
import com.avis.assistant.model.SpatialCue
import com.avis.assistant.model.SpatialDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class AlertCooldownManagerTest {

    private lateinit var manager: AlertCooldownManager

    @Before
    fun setUp() {
        manager = AlertCooldownManager(defaultCooldownMs = 3000L, urgentCenterCooldownMs = 1500L)
    }

    @Test
    fun testAlertEvaluationAllowsFirstAnnouncement() {
        val cue = SpatialCue(
            id = 1,
            label = "Obstacle",
            direction = SpatialDirection.CENTER,
            confidence = 0.9f,
            boundingBox = Rect(400, 200, 600, 400),
            frameWidth = 1000,
            frameHeight = 1000
        )

        val alert = manager.evaluateCue(cue, now = 10000L)
        assertNotNull(alert)
        assertEquals("Obstacle directly ahead", alert)
    }

    @Test
    fun testAlertEvaluationThrottlesRapidDuplicates() {
        val cue = SpatialCue(
            id = 1,
            label = "Obstacle",
            direction = SpatialDirection.CENTER,
            confidence = 0.9f,
            boundingBox = Rect(400, 200, 600, 400),
            frameWidth = 1000,
            frameHeight = 1000
        )

        // First alert succeeds
        val firstAlert = manager.evaluateCue(cue, now = 10000L)
        assertNotNull(firstAlert)

        // Second alert 500ms later is blocked by cooldown (1500ms required)
        val throttledAlert = manager.evaluateCue(cue, now = 10500L)
        assertNull(throttledAlert)

        // Third alert 2000ms later succeeds
        val resumedAlert = manager.evaluateCue(cue, now = 12001L)
        assertNotNull(resumedAlert)
    }

    @Test
    fun testPrioritySelectionPrefersCenterOverLateral() {
        val leftCue = SpatialCue(
            id = 1,
            label = "Chair",
            direction = SpatialDirection.LEFT,
            confidence = 0.95f,
            boundingBox = Rect(50, 100, 250, 300),
            frameWidth = 1000,
            frameHeight = 1000
        )

        val centerCue = SpatialCue(
            id = 2,
            label = "Doorway",
            direction = SpatialDirection.CENTER,
            confidence = 0.70f,
            boundingBox = Rect(400, 100, 600, 500),
            frameWidth = 1000,
            frameHeight = 1000
        )

        val priority = manager.selectPriorityCue(listOf(leftCue, centerCue))
        assertNotNull(priority)
        assertEquals(SpatialDirection.CENTER, priority?.direction)
        assertEquals("Doorway", priority?.label)
    }

    @Test
    fun testFriendlyLabelFormatting() {
        val cue = SpatialCue(
            id = 3,
            label = "home good",
            direction = SpatialDirection.RIGHT,
            confidence = 0.85f,
            boundingBox = Rect(700, 100, 900, 300),
            frameWidth = 1000,
            frameHeight = 1000
        )

        val alert = manager.evaluateCue(cue, now = 1000L)
        assertEquals("Furniture on your right", alert)
    }
}
