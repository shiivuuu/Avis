package com.avis.assistant.speech

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

class TtsManager(
    context: Context,
    private val onInitComplete: ((Boolean) -> Unit)? = null
) : TextToSpeech.OnInitListener {

    private val tag = "AvisTTS"
    private var tts: TextToSpeech? = null
    var isInitialized = false
        private set

    private var lastSpokenText: String = ""
    private var lastSpokenTime: Long = 0L
    private val deduplicationWindowMs = 2500L

    var onSpeechStateChanged: ((isSpeaking: Boolean) -> Unit)? = null

    init {
        tts = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale.US)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(tag, "Language US not supported or missing data, falling back to default")
                tts?.language = Locale.getDefault()
            }
            tts?.setSpeechRate(1.05f)
            tts?.setPitch(1.0f)
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    onSpeechStateChanged?.invoke(true)
                }

                override fun onDone(utteranceId: String?) {
                    onSpeechStateChanged?.invoke(false)
                }

                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    onSpeechStateChanged?.invoke(false)
                }

                override fun onError(utteranceId: String?, errorCode: Int) {
                    Log.e(tag, "TTS utterance error: $errorCode")
                    onSpeechStateChanged?.invoke(false)
                }
            })
            isInitialized = true
            Log.i(tag, "TTS successfully initialized")
            onInitComplete?.invoke(true)
        } else {
            Log.e(tag, "TTS initialization failed with status: $status")
            isInitialized = false
            onInitComplete?.invoke(false)
        }
    }

    /**
     * Speaks text if initialized.
     * @param text Text to speak.
     * @param flush If true, interrupts current speech immediately. If false, queues behind current speech.
     * @param deduplicate If true, ignores duplicate text within the deduplication window.
     */
    fun speak(text: String, flush: Boolean = false, deduplicate: Boolean = true) {
        if (!isInitialized || text.isBlank()) return

        val now = System.currentTimeMillis()
        if (deduplicate && text.equals(lastSpokenText, ignoreCase = true) && (now - lastSpokenTime) < deduplicationWindowMs) {
            return
        }

        lastSpokenText = text
        lastSpokenTime = now

        val queueMode = if (flush) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD
        val utteranceId = "Avis_${System.currentTimeMillis()}"
        tts?.speak(text, queueMode, null, utteranceId)
    }

    /**
     * Immediately stops any speech output.
     */
    fun stop() {
        if (isInitialized) {
            tts?.stop()
            onSpeechStateChanged?.invoke(false)
        }
    }

    fun release() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}
