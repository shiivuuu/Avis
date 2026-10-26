package com.avis.assistant.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.avis.assistant.model.AppMode
import com.avis.assistant.ui.components.AccessibleButton
import com.avis.assistant.ui.components.StatusHeader
import com.avis.assistant.ui.screens.AssistantScreen
import com.avis.assistant.ui.screens.DocumentScreen
import com.avis.assistant.ui.screens.NavigationScreen
import com.avis.assistant.ui.theme.ForestGreenDark
import com.avis.assistant.ui.theme.TextHighContrast
import com.avis.assistant.ui.theme.WarmIvoryBackground
import com.avis.assistant.ui.theme.WarmIvoryBorder
import com.avis.assistant.ui.theme.WarmIvorySurface

@Composable
fun AvisApp(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    LaunchedEffect(lifecycleOwner) {
        viewModel.setLifecycleOwner(lifecycleOwner)
    }

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    var hasAudioPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasCameraPermission = permissions[Manifest.permission.CAMERA] ?: hasCameraPermission
        hasAudioPermission = permissions[Manifest.permission.RECORD_AUDIO] ?: hasAudioPermission
        if (hasCameraPermission) {
            viewModel.ttsManager.speak("Permissions granted. Ready for navigation.", flush = true)
        }
    }

    val currentMode by viewModel.currentMode.collectAsState()
    val navigationState by viewModel.navigationState.collectAsState()
    val documentState by viewModel.documentState.collectAsState()
    val assistantState by viewModel.assistantState.collectAsState()

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = WarmIvoryBackground,
        topBar = {
            if (hasCameraPermission) {
                StatusHeader(
                    currentMode = currentMode,
                    onModeSelected = { viewModel.switchMode(it) },
                    cameraActive = navigationState.cameraActive,
                    micAvailable = hasAudioPermission && viewModel.speechInputManager.isAvailable,
                    backendConnected = assistantState.backendAvailable
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (!hasCameraPermission) {
                // Permission Request Screen
                PermissionRequestContent(
                    onRequestPermissions = {
                        permissionLauncher.launch(
                            arrayOf(
                                Manifest.permission.CAMERA,
                                Manifest.permission.RECORD_AUDIO
                            )
                        )
                    }
                )
            } else {
                when (currentMode) {
                    AppMode.NAVIGATION -> {
                        NavigationScreen(
                            state = navigationState,
                            onStartNavigation = { viewModel.startNavigation() },
                            onStopNavigation = { viewModel.stopNavigation() },
                            onPreviewViewCreated = { viewModel.setPreviewView(it) }
                        )
                    }
                    AppMode.DOCUMENT -> {
                        DocumentScreen(
                            state = documentState,
                            onCapture = { viewModel.captureDocument() },
                            onReadAloud = { viewModel.readDocumentAloud() },
                            onStopReading = { viewModel.stopReadingDocument() },
                            onClear = { viewModel.clearDocument() },
                            onVoiceAction = { viewModel.startVoiceQuery() },
                            speechAvailable = hasAudioPermission && viewModel.speechInputManager.isAvailable,
                            onPreviewViewCreated = { viewModel.setPreviewView(it) }
                        )
                    }
                    AppMode.ASSISTANT -> {
                        AssistantScreen(
                            state = assistantState,
                            onQueryChanged = { viewModel.updateAssistantQuery(it) },
                            onSubmitQuery = { viewModel.submitAssistantQuery() },
                            onStartVoiceQuery = { viewModel.startVoiceQuery() },
                            onStopVoiceQuery = { viewModel.stopVoiceQuery() },
                            onReadAnswer = { viewModel.readAssistantAnswerAloud() },
                            onServerUrlConfigured = { viewModel.configureServerUrl(it) },
                            speechAvailable = hasAudioPermission && viewModel.speechInputManager.isAvailable,
                            onPreviewViewCreated = { viewModel.setPreviewView(it) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionRequestContent(
    onRequestPermissions: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(96.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(WarmIvorySurface)
                .border(2.dp, ForestGreenDark, RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Security,
                contentDescription = null,
                tint = ForestGreenDark,
                modifier = Modifier.size(48.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Welcome to Avis",
            style = MaterialTheme.typography.headlineMedium,
            color = ForestGreenDark,
            fontWeight = FontWeight.Black
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "To assist you with real-time obstacle awareness and document reading, Avis requires access to your camera and microphone.",
            style = MaterialTheme.typography.bodyLarge,
            color = TextHighContrast,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        AccessibleButton(
            onClick = onRequestPermissions,
            contentDescriptionText = "Grant camera and microphone permissions button"
        ) {
            Icon(
                imageVector = Icons.Default.CameraAlt,
                contentDescription = null,
                tint = Color.White
            )
            Spacer(modifier = Modifier.size(12.dp))
            Text(
                text = "GRANT PERMISSIONS",
                style = MaterialTheme.typography.labelLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
