package com.avis.assistant.ui.screens

import android.graphics.Bitmap
import android.view.ViewGroup
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.avis.assistant.model.DocumentState
import com.avis.assistant.ui.components.AccessibleButton
import com.avis.assistant.ui.theme.ForestGreenDark
import com.avis.assistant.ui.theme.ForestGreenSecondary
import com.avis.assistant.ui.theme.HazardRed
import com.avis.assistant.ui.theme.TextHighContrast
import com.avis.assistant.ui.theme.WarmIvoryBorder
import com.avis.assistant.ui.theme.WarmIvorySurface

@Composable
fun DocumentScreen(
    state: DocumentState,
    onCapture: () -> Unit,
    onReadAloud: () -> Unit,
    onStopReading: () -> Unit,
    onClear: () -> Unit,
    onVoiceAction: () -> Unit,
    speechAvailable: Boolean,
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
        // Viewfinder / Captured Image Box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Black)
                .border(2.dp, WarmIvoryBorder, RoundedCornerShape(16.dp))
                .semantics {
                    contentDescription = if (state.capturedImage != null) {
                        "Captured document photo"
                    } else {
                        "Document camera viewfinder. Position page inside this frame."
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            if (state.capturedImage != null) {
                Image(
                    bitmap = state.capturedImage.asImageBitmap(),
                    contentDescription = "Captured page",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
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
            }

            if (state.isProcessing) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.5f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = Color.White)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Analyzing text locally...",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Action Buttons Row
        if (state.capturedImage == null) {
            AccessibleButton(
                onClick = onCapture,
                enabled = !state.isProcessing,
                contentDescriptionText = "Capture Document. Takes a photo and runs on-device text recognition."
            ) {
                Icon(
                    imageVector = Icons.Default.CameraAlt,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "CAPTURE DOCUMENT",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Black
                )
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AccessibleButton(
                    onClick = onCapture,
                    modifier = Modifier.weight(1f),
                    contentDescriptionText = "Capture new photo"
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "RETAKE",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }

                AccessibleButton(
                    onClick = onClear,
                    isDestructive = true,
                    modifier = Modifier.weight(1f),
                    contentDescriptionText = "Clear document and return to camera"
                ) {
                    Icon(
                        imageVector = Icons.Default.Clear,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "CLEAR",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }
            }
        }

        // Read Aloud / Stop Controls
        if (state.recognizedText.isNotBlank()) {
            if (state.isReadingAloud) {
                AccessibleButton(
                    onClick = onStopReading,
                    isDestructive = true,
                    contentDescriptionText = "Stop Reading Aloud"
                ) {
                    Icon(
                        imageVector = Icons.Default.Pause,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "STOP READING",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }
            } else {
                AccessibleButton(
                    onClick = onReadAloud,
                    contentDescriptionText = "Read Recognized Text Aloud"
                ) {
                    Icon(
                        imageVector = Icons.Default.VolumeUp,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "READ ALOUD",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }
            }
        }

        // Voice Command Action Button
        if (speechAvailable) {
            AccessibleButton(
                onClick = onVoiceAction,
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = ForestGreenSecondary,
                    contentColor = Color.White
                ),
                contentDescriptionText = "Speak question or command regarding this document"
            ) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = null,
                    tint = Color.White
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "VOICE COMMAND",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White
                )
            }
        }

        // Status / Feedback message
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(WarmIvorySurface)
                .border(1.dp, WarmIvoryBorder, RoundedCornerShape(12.dp))
                .padding(12.dp)
                .semantics {
                    liveRegion = LiveRegionMode.Polite
                    contentDescription = state.statusMessage
                }
        ) {
            Text(
                text = state.statusMessage,
                style = MaterialTheme.typography.bodyLarge,
                color = TextHighContrast
            )
        }

        // Recognized Text Display Card
        if (state.recognizedText.isNotBlank()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .border(2.dp, ForestGreenDark.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                    .padding(16.dp)
                    .semantics {
                        contentDescription = "Recognized text content: ${state.recognizedText}"
                    }
            ) {
                Text(
                    text = "RECOGNIZED TEXT",
                    style = MaterialTheme.typography.labelLarge,
                    color = ForestGreenDark,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = state.recognizedText,
                    style = MaterialTheme.typography.bodyLarge.copy(lineHeight = 28.sp),
                    color = TextHighContrast
                )
            }
        }
    }
}
