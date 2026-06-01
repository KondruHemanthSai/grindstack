package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val GrindStackColorScheme = darkColorScheme(
    primary = AccentOrange,
    secondary = AccentGreen,
    tertiary = AccentPurple,
    background = SpaceBlack,
    surface = SpaceBlack,
    onPrimary = SpaceBlack,
    onSecondary = SpaceBlack,
    onTertiary = TextPrimary,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    surfaceVariant = CardBg,
    onSurfaceVariant = TextSecondary,
    outline = CardBorder
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true, // Force Dark Theme only per spec
    dynamicColor: Boolean = false, // Enforce unified custom color branding
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = GrindStackColorScheme,
        typography = Typography,
        content = content
    )
}
