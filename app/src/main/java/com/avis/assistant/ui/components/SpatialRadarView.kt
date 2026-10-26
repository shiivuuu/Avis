package com.avis.assistant.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avis.assistant.model.SpatialCue
import com.avis.assistant.model.SpatialDirection
import com.avis.assistant.ui.theme.ForestGreenDark
import com.avis.assistant.ui.theme.HazardContainer
import com.avis.assistant.ui.theme.HazardRed
import com.avis.assistant.ui.theme.MintContainer
import com.avis.assistant.ui.theme.TextHighContrast
import com.avis.assistant.ui.theme.WarmIvoryBorder
import com.avis.assistant.ui.theme.WarmIvorySurface

@Composable
fun SpatialRadarView(
    activeCues: List<SpatialCue>,
    modifier: Modifier = Modifier
) {
    val leftCues = activeCues.filter { it.direction == SpatialDirection.LEFT }
    val centerCues = activeCues.filter { it.direction == SpatialDirection.CENTER }
    val rightCues = activeCues.filter { it.direction == SpatialDirection.RIGHT }

    val hasCenterObstacle = centerCues.isNotEmpty()
    val hasLeftObstacle = leftCues.isNotEmpty()
    val hasRightObstacle = rightCues.isNotEmpty()

    val radarSummary = buildString {
        append("Spatial radar: ")
        if (hasCenterObstacle) append("Obstacle directly ahead. ")
        if (hasLeftObstacle) append("Object on your left. ")
        if (hasRightObstacle) append("Object on your right. ")
        if (!hasCenterObstacle && !hasLeftObstacle && !hasRightObstacle) {
            append("Path clear.")
        }
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(WarmIvorySurface)
            .border(1.dp, WarmIvoryBorder, RoundedCornerShape(16.dp))
            .padding(12.dp)
            .semantics {
                liveRegion = LiveRegionMode.Polite
                contentDescription = radarSummary
            }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "SPATIAL FIELD OF VIEW",
                style = MaterialTheme.typography.labelLarge,
                color = ForestGreenDark,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
            Text(
                text = if (activeCues.isEmpty()) "CLEAR" else "${activeCues.size} DETECTED",
                style = MaterialTheme.typography.bodyMedium,
                color = if (hasCenterObstacle) HazardRed else ForestGreenDark,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            RadarZoneCard(
                title = "LEFT",
                cues = leftCues,
                isObstaclePresent = hasLeftObstacle,
                isUrgent = false,
                modifier = Modifier.weight(1f)
            )

            RadarZoneCard(
                title = "AHEAD",
                cues = centerCues,
                isObstaclePresent = hasCenterObstacle,
                isUrgent = true,
                modifier = Modifier.weight(1.2f)
            )

            RadarZoneCard(
                title = "RIGHT",
                cues = rightCues,
                isObstaclePresent = hasRightObstacle,
                isUrgent = false,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun RadarZoneCard(
    title: String,
    cues: List<SpatialCue>,
    isObstaclePresent: Boolean,
    isUrgent: Boolean,
    modifier: Modifier = Modifier
) {
    val containerBg = when {
        isObstaclePresent && isUrgent -> HazardContainer
        isObstaclePresent -> Color(0xFFFFF3CD)
        else -> MintContainer
    }

    val contentColor = when {
        isObstaclePresent && isUrgent -> HazardRed
        isObstaclePresent -> Color(0xFF664D03)
        else -> ForestGreenDark
    }

    val labelText = if (cues.isNotEmpty()) {
        cues.first().label
    } else {
        "Clear"
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(containerBg)
            .border(1.5.dp, contentColor.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
            .padding(vertical = 12.dp, horizontal = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = contentColor,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(4.dp))
            if (isObstaclePresent) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = contentColor,
                    modifier = Modifier.size(18.dp)
                )
            }
            Text(
                text = labelText,
                style = MaterialTheme.typography.bodyMedium,
                color = TextHighContrast,
                fontWeight = if (isObstaclePresent) FontWeight.Bold else FontWeight.Normal,
                maxLines = 1
            )
        }
    }
}
