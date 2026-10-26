package com.avis.assistant.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AvisColorScheme = lightColorScheme(
    primary = ForestGreenPrimary,
    onPrimary = Color.White,
    primaryContainer = MintContainer,
    onPrimaryContainer = MintText,
    secondary = ForestGreenSecondary,
    onSecondary = Color.White,
    secondaryContainer = WarmIvoryContainer,
    onSecondaryContainer = TextHighContrast,
    tertiary = ForestGreenLight,
    onTertiary = Color.White,
    background = WarmIvoryBackground,
    onBackground = TextHighContrast,
    surface = WarmIvorySurface,
    onSurface = TextHighContrast,
    surfaceVariant = WarmIvoryContainer,
    onSurfaceVariant = TextMediumContrast,
    outline = WarmIvoryBorder,
    error = HazardRed,
    onError = Color.White,
    errorContainer = HazardContainer,
    onErrorContainer = HazardText
)

@Composable
fun AvisTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AvisColorScheme,
        typography = Typography,
        content = content
    )
}
