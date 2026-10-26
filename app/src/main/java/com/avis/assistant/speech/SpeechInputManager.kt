package com.avis.assistant.speech

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import java.util.Locale

class SpeechInputManager(
    private val context: Context,
    private val onResult: (String) -> Unit,
    private val onError: (String) -> Unit,
    private val onListeningStateChanged: (Boolean) -> Unit
) : RecognitionListener {

    private val tag = "AvisSpeechInput"
    private var speechRecognizer: SpeechRecognizer? = null

    val isAvailable: Boolean
        get() = SpeechRecognizer.isRecognitionAvailable(context)

    fun startListening() {
        if (!isAvailable) {
            onError("Voice recognition service is not available on this device.")
            return
        }

        stopListening()

        try {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(this@SpeechInputManager)
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            }

            speechRecognizer?.startListening(intent)
            onListeningStateChanged(true)
        } catch (e: Exception) {
            Log.e(tag, "Failed to start speech recognizer: ${e.message}", e)
            onListeningStateChanged(false)
            onError("Could not initialize voice input: ${e.localizedMessage}")
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
            speechRecognizer?.destroy()
            speechRecognizer = null
        } catch (e: Exception) {
            Log.e(tag, "Error destroying speech recognizer: ${e.message}")
        } finally {
            onListeningStateChanged(false)
        }
    }

    override fun onReadyForSpeech(params: Bundle?) {
        Log.d(tag, "Ready for speech")
    }

    override fun onBeginningOfSpeech() {
        Log.d(tag, "Speech begun")
    }

    override fun onRmsChanged(rmsdB: Float) {}

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        onListeningStateChanged(false)
    }

    override fun onError(error: Int) {
        onListeningStateChanged(false)
        val errorMessage = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Audio permission not granted"
            SpeechRecognizer.ERROR_NETWORK -> "Network required for speech transcription"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Speech recognition network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech was understood. Please speak clearly."
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech service is busy"
            SpeechRecognizer.ERROR_SERVER -> "Speech server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected"
            else -> "Speech recognition error: $error"
        }
        Log.w(tag, "Speech error ($error): $errorMessage")
        onError(errorMessage)
    }

    override fun onResults(results: Bundle?) {
        onListeningStateChanged(false)
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val text = matches[0]
            Log.i(tag, "Speech recognized: $text")
            onResult(text)
        } else {
            onError("No text recognized.")
        }
    }

    override fun onPartialResults(partialResults: Bundle?) {}

    override fun onEvent(eventType: Int, params: Bundle?) {}

    fun release() {
        stopListening()
    }
}
