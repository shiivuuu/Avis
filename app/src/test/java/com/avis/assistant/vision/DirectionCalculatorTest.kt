package com.avis.assistant.vision

import com.avis.assistant.model.SpatialDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DirectionCalculatorTest {

    @Test
    fun testLeftDirectionCalculatedCorrectly() {
        // Frame width: 1000. Left zone is centerX < 350.
        // Left=50, Right=250 -> centerX = 150 (normalized = 0.15)
        val direction = DirectionCalculator.calculateDirection(
            left = 50,
            right = 250,
            frameWidth = 1000
        )
        assertEquals(SpatialDirection.LEFT, direction)
    }

    @Test
    fun testCenterDirectionCalculatedCorrectly() {
        // Frame width: 1000. Center zone is 350 <= centerX <= 650.
        // Left=400, Right=600 -> centerX = 500 (normalized = 0.50)
        val direction = DirectionCalculator.calculateDirection(
            left = 400,
            right = 600,
            frameWidth = 1000
        )
        assertEquals(SpatialDirection.CENTER, direction)
    }

    @Test
    fun testRightDirectionCalculatedCorrectly() {
        // Frame width: 1000. Right zone is centerX > 650.
        // Left=700, Right=900 -> centerX = 800 (normalized = 0.80)
        val direction = DirectionCalculator.calculateDirection(
            left = 700,
            right = 900,
            frameWidth = 1000
        )
        assertEquals(SpatialDirection.RIGHT, direction)
    }

    @Test
    fun testSignificantObstacleFilter() {
        // Frame: 1000x1000 = 1,000,000 px^2
        // Box: 200x200 = 40,000 px^2 = 4% of frame -> should be significant (threshold is 2%)
        val isSignificant = DirectionCalculator.isSignificantObstacle(
            left = 100,
            top = 100,
            right = 300,
            bottom = 300,
            frameWidth = 1000,
            frameHeight = 1000
        )
        assertTrue(isSignificant)

        // Tiny Box: 10x10 = 100 px^2 = 0.01% of frame -> should be filtered out
        val isTinySignificant = DirectionCalculator.isSignificantObstacle(
            left = 100,
            top = 100,
            right = 110,
            bottom = 110,
            frameWidth = 1000,
            frameHeight = 1000
        )
        assertFalse(isTinySignificant)
    }

    @Test
    fun testZeroDimensionsFallback() {
        val direction = DirectionCalculator.calculateDirection(
            left = 100,
            right = 300,
            frameWidth = 0
        )
        assertEquals(SpatialDirection.CENTER, direction)

        val isSignificant = DirectionCalculator.isSignificantObstacle(
            left = 100,
            top = 100,
            right = 300,
            bottom = 300,
            frameWidth = 0,
            frameHeight = 0
        )
        assertFalse(isSignificant)
    }
}
