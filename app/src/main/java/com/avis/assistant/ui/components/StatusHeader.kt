package com.avis.assistant.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avis.assistant.model.AppMode
import com.avis.assistant.ui.theme.ActiveIndicatorGreen
import com.avis.assistant.ui.theme.ForestGreenDark
import com.avis.assistant.ui.theme.ForestGreenSecondary
import com.avis.assistant.ui.theme.HazardRed
import com.avis.assistant.ui.theme.MintContainer
import com.avis.assistant.ui.theme.WarmIvoryBorder
import com.avis.assistant.ui.theme.WarmIvorySurface

@Composable
fun StatusHeader(
    currentMode: AppMode,
    onModeSelected: (AppMode) -> Unit,
    cameraActive: Boolean,
    micAvailable: Boolean,
    backendConnected: Boolean,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = WarmIvorySurface,
        shape = RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp),
        shadowElevation = 2.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            // Top branding row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "AVIS",
                        style = MaterialTheme.typography.headlineMedium,
                        color = ForestGreenDark,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "Assistive Vision System",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Status badges
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusIndicator(
                        icon = Icons.Default.CameraAlt,
                        label = "Camera",
                        isActive = cameraActive,
                        activeColor = ActiveIndicatorGreen
                    )
                    StatusIndicator(
                        icon = Icons.Default.Mic,
                        label = "Mic",
                        isActive = micAvailable,
                        activeColor = ActiveIndicatorGreen
                    )
                    StatusIndicator(
                        icon = Icons.Default.Cloud,
                        label = "Cloud AI",
                        isActive = backendConnected,
                        activeColor = ForestGreenSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Mode Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background, RoundedCornerShape(12.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                AppMode.values().forEach { mode ->
                    val isSelected = currentMode == mode
                    ModeTabItem(
                        mode = mode,
                        isSelected = isSelected,
                        onClick = { onModeSelected(mode) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun ModeTabItem(
    mode: AppMode,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) ForestGreenDark else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp)
            .semantics {
                role = Role.Tab
                selected = isSelected
                contentDescription = "${mode.title} mode: ${mode.description}"
            },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = mode.title,
            style = MaterialTheme.typography.titleMedium,
            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onBackground,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun StatusIndicator(
    icon: ImageVector,
    label: String,
    isActive: Boolean,
    activeColor: Color
) {
    val statusText = if (isActive) "active" else "idle"
    Row(
        modifier = Modifier
            .background(
                if (isActive) MintContainer else Color(0xFFEBE6DC),
                RoundedCornerShape(16.dp)
            )
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .semantics {
                contentDescription = "$label status is $statusText"
            },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (isActive) activeColor else Color.Gray,
            modifier = Modifier.size(16.dp)
        )
        Box(
            modifier = Modifier
                .size(7.dp)
                .background(if (isActive) activeColor else Color.Gray, CircleShape)
        )
    }
}
