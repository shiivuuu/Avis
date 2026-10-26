package com.avis.assistant.ui

import android.app.Application
import android.graphics.Bitmap
import android.util.Log
import androidx.camera.core.ImageProxy
import androidx.camera.view.PreviewView
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.viewModelScope
import com.avis.assistant.camera.CameraManager
import com.avis.assistant.model.AppMode
import com.avis.assistant.model.AssistantState
import com.avis.assistant.model.DocumentState
import com.avis.assistant.model.NavigationState
import com.avis.assistant.model.SpatialCue
import com.avis.assistant.network.VisionApiClient
import com.avis.assistant.speech.SpeechInputManager
import com.avis.assistant.speech.TtsManager
import com.avis.assistant.vision.AlertCooldownManager
import com.avis.assistant.vision.DocumentOcrManager
import com.avis.assistant.vision.ObjectDetectorManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val tag = "AvisMainViewModel"

    // Subsystems
    val cameraManager = CameraManager(application)
    val ttsManager = TtsManager(application)
    val objectDetectorManager = ObjectDetectorManager()
    val alertCooldownManager = AlertCooldownManager()
    val documentOcrManager = DocumentOcrManager()
    val visionApiClient = VisionApiClient()

    lateinit var speechInputManager: SpeechInputManager

    // UI States
    private val _currentMode = MutableStateFlow(AppMode.NAVIGATION)
    val currentMode: StateFlow<AppMode> = _currentMode.asStateFlow()

    private val _navigationState = MutableStateFlow(NavigationState())
    val navigationState: StateFlow<NavigationState> = _navigationState.asStateFlow()

    private val _documentState = MutableStateFlow(DocumentState())
    val documentState: StateFlow<DocumentState> = _documentState.asStateFlow()

    private val _assistantState = MutableStateFlow(AssistantState())
    val assistantState: StateFlow<AssistantState> = _assistantState.asStateFlow()

    private var activeLifecycleOwner: LifecycleOwner? = null
    private var activePreviewView: PreviewView? = null

    init {
        speechInputManager = SpeechInputManager(
            context = application,
            onResult = { text ->
                onSpeechRecognized(text)
            },
            onError = { error ->
                Log.w(tag, "Speech recognition error: $error")
                _assistantState.update { it.copy(isListening = false, statusMessage = error) }
            },
            onListeningStateChanged = { listening ->
                _assistantState.update { it.copy(isListening = listening) }
            }
        )

        ttsManager.onSpeechStateChanged = { speaking ->
            _documentState.update { it.copy(isReadingAloud = speaking) }
        }

        // Check backend health asynchronously
        viewModelScope.launch {
            val isHealthy = visionApiClient.checkHealth()
            _assistantState.update { it.copy(backendAvailable = isHealthy) }
        }
    }

    fun setLifecycleOwner(lifecycleOwner: LifecycleOwner) {
        this.activeLifecycleOwner = lifecycleOwner
    }

    fun setPreviewView(previewView: PreviewView) {
        this.activePreviewView = previewView
    }

    fun switchMode(newMode: AppMode) {
        if (_currentMode.value == newMode) return

        // Stop TTS speaking or listening when switching modes
        ttsManager.stop()
        speechInputManager.stopListening()

        // If leaving navigation, stop camera analysis
        if (_currentMode.value == AppMode.NAVIGATION && _navigationState.value.isNavigating) {
            stopNavigation()
        }

        _currentMode.value = newMode
        val modeAnnouncement = when (newMode) {
            AppMode.NAVIGATION -> "Switched to Navigation mode"
            AppMode.DOCUMENT -> "Switched to Document Reader mode"
            AppMode.ASSISTANT -> "Switched to AI Assistant mode"
        }
        ttsManager.speak(modeAnnouncement, flush = true)

        // For Document and Assistant modes, start camera preview so viewfinder is ready
        if (newMode != AppMode.NAVIGATION) {
            startCameraPreviewOnly()
        }
    }

    // ---------------------------------------------------------
    // NAVIGATION MODE
    // ---------------------------------------------------------

    fun startNavigation() {
        val owner = activeLifecycleOwner ?: run {
            Log.e(tag, "Cannot start navigation: LifecycleOwner is null")
            return
        }

        ttsManager.speak("Starting navigation. Scanning surroundings.", flush = true)
        alertCooldownManager.reset()

        cameraManager.startCamera(
            lifecycleOwner = owner,
            previewView = activePreviewView,
            onFrameAnalysis = { imageProxy ->
                handleNavigationFrame(imageProxy)
            },
            onStarted = {
                _navigationState.update {
                    it.copy(
                        isNavigating = true,
                        cameraActive = true,
                        lastAnnouncement = "Navigation active. Scanning for obstacles."
                    )
                }
            },
            onError = { error ->
                _navigationState.update {
                    it.copy(
                        isNavigating = false,
                        cameraActive = false,
                        lastAnnouncement = "Camera error: $error"
                    )
                }
                ttsManager.speak("Camera failed to start. $error", flush = true)
            }
        )
    }

    private fun handleNavigationFrame(imageProxy: ImageProxy) {
        if (!_navigationState.value.isNavigating) {
            imageProxy.close()
            return
        }

        objectDetectorManager.processImage(
            imageProxy = imageProxy,
            onSuccess = { cues ->
                processDetectedCues(cues)
            },
            onError = { ex ->
                Log.w(tag, "Frame analysis error: ${ex.message}")
            }
        )
    }

    private fun processDetectedCues(cues: List<SpatialCue>) {
        val priorityCue = alertCooldownManager.selectPriorityCue(cues)

        if (priorityCue != null) {
            val announcement = alertCooldownManager.evaluateCue(priorityCue)
            if (announcement != null) {
                ttsManager.speak(announcement, flush = false, deduplicate = true)
                _navigationState.update {
                    it.copy(
                        activeCues = cues,
                        lastAnnouncement = announcement
                    )
                }
                return
            }
        }

        _navigationState.update {
            it.copy(activeCues = cues)
        }
    }

    fun stopNavigation() {
        cameraManager.stopCamera()
        alertCooldownManager.reset()
        _navigationState.update {
            it.copy(
                isNavigating = false,
                cameraActive = false,
                activeCues = emptyList(),
                lastAnnouncement = "Navigation stopped. Tap Start Navigation to resume."
            )
        }
        ttsManager.speak("Navigation stopped.", flush = true)
    }

    // ---------------------------------------------------------
    // DOCUMENT MODE
    // ---------------------------------------------------------

    private fun startCameraPreviewOnly() {
        val owner = activeLifecycleOwner ?: return
        cameraManager.startCamera(
            lifecycleOwner = owner,
            previewView = activePreviewView,
            onFrameAnalysis = null,
            onStarted = {
                _navigationState.update { it.copy(cameraActive = true) }
            },
            onError = { err ->
                Log.e(tag, "Camera preview error: $err")
            }
        )
    }

    fun captureDocument() {
        ttsManager.speak("Capturing photo. Please hold steady.", flush = true)
        _documentState.update { it.copy(isProcessing = true, statusMessage = "Capturing image...") }

        cameraManager.captureStillBitmap(
            onSuccess = { bitmap ->
                _documentState.update {
                    it.copy(
                        capturedImage = bitmap,
                        isProcessing = true,
                        statusMessage = "Analyzing document with on-device OCR..."
                    )
                }

                documentOcrManager.processBitmap(bitmap) { result ->
                    _documentState.update {
                        it.copy(
                            isProcessing = false,
                            recognizedText = result.fullText,
                            statusMessage = result.feedbackMessage
                        )
                    }

                    if (result.isSuccessful) {
                        val speechSummary = "Text recognized. ${result.lineCount} lines found. Tap Read Aloud to listen."
                        ttsManager.speak(speechSummary, flush = true)
                    } else {
                        ttsManager.speak(result.feedbackMessage, flush = true)
                    }
                }
            },
            onError = { error ->
                _documentState.update {
                    it.copy(isProcessing = false, statusMessage = "Capture error: $error")
                }
                ttsManager.speak("Failed to capture photo. $error", flush = true)
            }
        )
    }

    fun readDocumentAloud() {
        val text = _documentState.value.recognizedText
        if (text.isNotBlank()) {
            ttsManager.speak(text, flush = true, deduplicate = false)
        }
    }

    fun stopReadingDocument() {
        ttsManager.stop()
        _documentState.update { it.copy(isReadingAloud = false) }
    }

    fun clearDocument() {
        ttsManager.stop()
        _documentState.update {
            it.copy(
                capturedImage = null,
                recognizedText = "",
                isProcessing = false,
                isReadingAloud = false,
                statusMessage = "Align text within camera view and tap Capture to read."
            )
        }
        startCameraPreviewOnly()
    }

    // ---------------------------------------------------------
    // ASSISTANT MODE
    // ---------------------------------------------------------

    fun updateAssistantQuery(query: String) {
        _assistantState.update { it.copy(queryText = query) }
    }

    fun startVoiceQuery() {
        if (!speechInputManager.isAvailable) {
            val msg = "Speech recognition is not available on this device."
            _assistantState.update { it.copy(statusMessage = msg) }
            ttsManager.speak(msg, flush = true)
            return
        }

        ttsManager.stop()
        _assistantState.update { it.copy(statusMessage = "Listening for your question...") }
        speechInputManager.startListening()
    }

    fun stopVoiceQuery() {
        speechInputManager.stopListening()
    }

    private fun onSpeechRecognized(text: String) {
        _assistantState.update {
            it.copy(
                queryText = text,
                isListening = false,
                statusMessage = "Question captured: $text"
            )
        }
        submitAssistantQuery()
    }

    fun submitAssistantQuery() {
        val query = _assistantState.value.queryText.trim()
        if (query.isBlank()) {
            val msg = "Please enter or speak a question first."
            _assistantState.update { it.copy(statusMessage = msg) }
            ttsManager.speak(msg, flush = true)
            return
        }

        _assistantState.update {
            it.copy(
                isProcessing = true,
                statusMessage = "Capturing view and contacting assistant..."
            )
        }
        ttsManager.speak("Analyzing your question.", flush = true)

        cameraManager.captureStillBitmap(
            onSuccess = { bitmap ->
                viewModelScope.launch {
                    val result = visionApiClient.askAssistant(bitmap, query)
                    result.onSuccess { answer ->
                        _assistantState.update {
                            it.copy(
                                isProcessing = false,
                                responseText = answer,
                                backendAvailable = true,
                                statusMessage = "Response received."
                            )
                        }
                        ttsManager.speak(answer, flush = true, deduplicate = false)
                    }.onFailure { ex ->
                        val errMsg = ex.message ?: "Assistant request failed."
                        _assistantState.update {
                            it.copy(
                                isProcessing = false,
                                responseText = "",
                                backendAvailable = false,
                                statusMessage = errMsg
                            )
                        }
                        ttsManager.speak("Assistant could not respond. $errMsg", flush = true)
                    }
                }
            },
            onError = { err ->
                _assistantState.update {
                    it.copy(isProcessing = false, statusMessage = "Camera capture failed: $err")
                }
                ttsManager.speak("Could not capture photo for question.", flush = true)
            }
        )
    }

    fun readAssistantAnswerAloud() {
        val answer = _assistantState.value.responseText
        if (answer.isNotBlank()) {
            ttsManager.speak(answer, flush = true, deduplicate = false)
        }
    }

    fun configureServerUrl(url: String) {
        visionApiClient.setBaseUrl(url)
        viewModelScope.launch {
            val isHealthy = visionApiClient.checkHealth()
            _assistantState.update { it.copy(backendAvailable = isHealthy) }
            val feedback = if (isHealthy) "Backend server connected." else "Could not reach backend at $url."
            ttsManager.speak(feedback, flush = true)
        }
    }

    override fun onCleared() {
        super.onCleared()
        cameraManager.release()
        ttsManager.release()
        objectDetectorManager.release()
        documentOcrManager.release()
        speechInputManager.release()
        Log.i(tag, "MainViewModel cleared and all subsystems released.")
    }
}
