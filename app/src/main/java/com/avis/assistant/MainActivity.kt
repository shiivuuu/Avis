package com.avis.assistant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.avis.assistant.ui.AvisApp
import com.avis.assistant.ui.MainViewModel
import com.avis.assistant.ui.theme.AvisTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AvisTheme {
                AvisApp(viewModel = viewModel)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isFinishing) {
            viewModel.ttsManager.stop()
            viewModel.cameraManager.stopCamera()
        }
    }
}
