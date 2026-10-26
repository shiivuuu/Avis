package com.avis.assistant.ui.screens

import android.view.ViewGroup
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.VolumeUp
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
import androidx.compose.ui.viewinterop.AndroidView
import com.avis.assistant.model.NavigationState
import com.avis.assistant.ui.components.AccessibleButton
import com.avis.assistant.ui.components.SpatialRadarView
import com.avis.assistant.ui.theme.ForestGreenDark
import com.avis.assistant.ui.theme.HazardRed
import com.avis.assistant.ui.theme.TextHighContrast
import com.avis.assistant.ui.theme.WarmIvoryBorder
import com.avis.assistant.ui.theme.WarmIvorySurface

@Composable
fun NavigationScreen(
    state: NavigationState,
    onStartNavigation: () -> Unit,
    onStopNavigation: () -> Unit,
    onPreviewViewCreated: (PreviewView) -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Camera Viewfinder Box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Black)
                .border(2.dp, WarmIvoryBorder, RoundedCornerShape(16.dp))
                .semantics {
                    contentDescription = if (state.isNavigating) {
                        "Live camera feed active for navigation analysis"
                    } else {
                        "Camera viewfinder paused"
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            AndroidView(
                factory = { context ->
                    PreviewView(context).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                        scaleType = PreviewView.ScaleType.FILL_CENTER
                        onPreviewViewCreated(this)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            if (!state.isNavigating) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.6f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Camera Paused",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Spatial Radar (Left, Ahead, Right)
        SpatialRadarView(activeCues = state.activeCues)

        // Spoken Announcement Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(WarmIvorySurface)
                .border(1.5.dp, ForestGreenDark.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                .padding(16.dp)
                .semantics {
                    liveRegion = LiveRegionMode.Assertive
                    contentDescription = "Current guidance announcement: ${state.lastAnnouncement}"
                }
        ) {
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.VolumeUp,
                    contentDescription = null,
                    tint = ForestGreenDark,
                    modifier = Modifier.size(28.dp)
                )
                Column {
                    Text(
                        text = "CURRENT GUIDANCE",
                        style = MaterialTheme.typography.labelLarge,
                        color = ForestGreenDark,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = state.lastAnnouncement,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextHighContrast,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Prominent Navigation Control Button
        if (state.isNavigating) {
            AccessibleButton(
                onClick = onStopNavigation,
                isDestructive = true,
                contentDescriptionText = "Stop Navigation. Cease camera analysis and directional alerts."
            ) {
                Icon(
                    imageVector = Icons.Default.Stop,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "STOP NAVIGATION",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Black
                )
            }
        } else {
            AccessibleButton(
                onClick = onStartNavigation,
                isDestructive = false,
                contentDescriptionText = "Start Navigation. Activates camera and real-time obstacle announcements."
            ) {
                Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "START NAVIGATION",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Black
                )
            }
        }

        // Safety Disclaimer Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFFF7F2E7))
                .border(1.dp, WarmIvoryBorder, RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = Color(0xFF6B5838),
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = "Safety Notice: generic camera object detection does not guarantee detection of overhead hazards (branches, signs) or drop-offs. Always rely primarily on your cane or guide dog.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF4A3E2A)
                )
            }
        }
    }
}
