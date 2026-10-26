package com.avis.assistant.ui.components

import android.view.HapticFeedbackConstants
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonColors
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.avis.assistant.ui.theme.ForestGreenDark
import com.avis.assistant.ui.theme.HazardRed

@Composable
fun AccessibleButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    contentDescriptionText: String? = null,
    isDestructive: Boolean = false,
    enabled: Boolean = true,
    colors: ButtonColors = if (isDestructive) {
        ButtonDefaults.buttonColors(
            containerColor = HazardRed,
            contentColor = Color.White,
            disabledContainerColor = Color(0xFFD6A59E),
            disabledContentColor = Color.White
        )
    } else {
        ButtonDefaults.buttonColors(
            containerColor = ForestGreenDark,
            contentColor = Color.White,
            disabledContainerColor = Color(0xFFA3B8AE),
            disabledContentColor = Color.White
        )
    },
    content: @Composable RowScope.() -> Unit
) {
    val view = LocalView.current

    Button(
        onClick = {
            view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
            onClick()
        },
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 64.dp)
            .heightIn(min = 64.dp)
            .semantics {
                role = Role.Button
                contentDescriptionText?.let {
                    this.contentDescription = it
                }
            },
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        colors = colors,
        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 16.dp),
        content = content
    )
}
