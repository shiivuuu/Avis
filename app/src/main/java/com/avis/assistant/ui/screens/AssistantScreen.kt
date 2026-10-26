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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.avis.assistant.model.AssistantState
import com.avis.assistant.ui.components.AccessibleButton
import com.avis.assistant.ui.theme.ForestGreenDark
import com.avis.assistant.ui.theme.ForestGreenSecondary
import com.avis.assistant.ui.theme.HazardRed
import com.avis.assistant.ui.theme.TextHighContrast
import com.avis.assistant.ui.theme.WarmIvoryBorder
import com.avis.assistant.ui.theme.WarmIvorySurface

@Composable
fun AssistantScreen(
    state: AssistantState,
    onQueryChanged: (String) -> Unit,
    onSubmitQuery: () -> Unit,
    onStartVoiceQuery: () -> Unit,
    onStopVoiceQuery: () -> Unit,
    onReadAnswer: () -> Unit,
    onServerUrlConfigured: (String) -> Unit,
    speechAvailable: Boolean,
    onPreviewViewCreated: (PreviewView) -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val focusManager = LocalFocusManager.current
    var showServerConfig by remember { mutableStateOf(false) }
    var serverUrlInput by remember { mutableStateOf("http://10.0.2.2:3001") }

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
                .height(200.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Black)
                .border(2.dp, WarmIvoryBorder, RoundedCornerShape(16.dp))
                .semantics {
                    contentDescription = "Assistant camera viewfinder"
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
                            text = "Analyzing visual question...",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Voice Query Button
        if (speechAvailable) {
            if (state.isListening) {
                AccessibleButton(
                    onClick = onStopVoiceQuery,
                    isDestructive = true,
                    contentDescriptionText = "Listening for your question. Tap to stop listening."
                ) {
                    Icon(
                        imageVector = Icons.Default.Stop,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "LISTENING... (TAP TO STOP)",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }
            } else {
                AccessibleButton(
                    onClick = onStartVoiceQuery,
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = ForestGreenSecondary,
                        contentColor = Color.White
                    ),
                    contentDescriptionText = "Speak question hands-free"
                ) {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "SPEAK QUESTION",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }
            }
        }

        // Text Input Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = state.queryText,
                onValueChange = onQueryChanged,
                modifier = Modifier
                    .weight(1f)
                    .semantics {
                        contentDescription = "Visual question input field"
                    },
                placeholder = {
                    Text("e.g., What color is this shirt? Is there a chair ahead?")
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = {
                    focusManager.clearFocus()
                    onSubmitQuery()
                }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ForestGreenDark,
                    unfocusedBorderColor = WarmIvoryBorder,
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp)
            )

            IconButton(
                onClick = {
                    focusManager.clearFocus()
                    onSubmitQuery()
                },
                modifier = Modifier
                    .size(56.dp)
                    .background(ForestGreenDark, RoundedCornerShape(12.dp))
                    .semantics {
                        contentDescription = "Send question with camera photo"
                    }
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = null,
                    tint = Color.White
                )
            }
        }

        // Status Card
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

        // AI Response Card
        if (state.responseText.isNotBlank()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .border(2.dp, ForestGreenDark.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                    .padding(16.dp)
                    .semantics {
                        liveRegion = LiveRegionMode.Assertive
                        contentDescription = "AI Assistant answer: ${state.responseText}"
                    }
            ) {
                Text(
                    text = "AI ASSISTANT RESPONSE",
                    style = MaterialTheme.typography.labelLarge,
                    color = ForestGreenDark,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = state.responseText,
                    style = MaterialTheme.typography.bodyLarge.copy(lineHeight = 28.sp),
                    color = TextHighContrast
                )
                Spacer(modifier = Modifier.height(12.dp))
                AccessibleButton(
                    onClick = onReadAnswer,
                    contentDescriptionText = "Read AI response aloud"
                ) {
                    Icon(
                        imageVector = Icons.Default.VolumeUp,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "READ ANSWER ALOUD",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White
                    )
                }
            }
        }

        // Server Settings Expansion
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFFF7F2E7))
                .border(1.dp, WarmIvoryBorder, RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Cloud,
                        contentDescription = null,
                        tint = ForestGreenDark,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Backend Server: ${if (state.backendAvailable) "Online" else "Offline / Local Only"}",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextHighContrast
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Default: http://10.0.2.2:3001 (Android Emulator). For a physical phone, set to your machine's LAN IP (e.g., http://192.168.1.X:3001). Local navigation & OCR always work without internet.",
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF555555)
            )
        }
    }
}
