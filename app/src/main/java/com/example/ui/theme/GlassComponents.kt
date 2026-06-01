package com.example.ui.theme

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Applies a gorgeous solid minimal background matching the Warm Minimal Theme (#111008)
 * and paints dynamic orange & purple mesh glows.
 */
fun Modifier.glassBackground() = this.drawBehind {
    // Solid warm dark base
    drawRect(color = SpaceBlack)
    
    // Top-left subtle orange radial glow
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(Color(0x0CFB923C), Color.Transparent),
            center = androidx.compose.ui.geometry.Offset(size.width * 0.15f, size.height * 0.12f),
            radius = size.minDimension * 0.65f
        ),
        center = androidx.compose.ui.geometry.Offset(size.width * 0.15f, size.height * 0.12f),
        radius = size.minDimension * 0.65f
    )
    
    // Bottom-right subtle purple radial glow
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(Color(0x0CA78BFA), Color.Transparent),
            center = androidx.compose.ui.geometry.Offset(size.width * 0.85f, size.height * 0.85f),
            radius = size.minDimension * 0.65f
        ),
        center = androidx.compose.ui.geometry.Offset(size.width * 0.85f, size.height * 0.85f),
        radius = size.minDimension * 0.65f
    )
}

/**
 * Replaces cards with a warm minimal frosted glassmorphism panel.
 * Uses exact specs matching Web PWA:
 * - background: rgba(255, 255, 255, 0.03)
 * - border: 1px solid rgba(255, 255, 255, 0.07)
 * - border radius: 16dp everywhere (matching PWA soft corners)
 */
fun Modifier.glassCard(
    shape: Shape = RoundedCornerShape(16.dp),
    borderAlpha: Float = 0.07f
) = this
    .clip(shape)
    .background(Color(0x08FFFFFF)) // rgba(255, 255, 255, 0.03)
    .border(
        width = 1.dp,
        color = Color.White.copy(alpha = borderAlpha), // rgba(255, 255, 255, 0.07)
        shape = shape
    )

/**
 * Custom modern solid action button styled as per PWA specifications:
 * - background: #f5f0e8 solid background
 * - text color: #111008 dark text
 * - corners: 10px (10.dp)
 * - height: 52px
 * - typography: 15px, semi-bold (600)
 * - dynamic pressed state scale down animation (0.97 with 100ms ease)
 */
@Composable
fun GrindButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.97f else 1f,
        animationSpec = tween(100),
        label = "ButtonScale"
    )

    Box(
        modifier = modifier
            .scale(scale)
            .height(52.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(if (enabled) WarmAccentWhite else WarmAccentWhite.copy(alpha = 0.5f))
            .pointerInput(enabled) {
                if (enabled) {
                    detectTapGestures(
                        onPress = {
                            isPressed = true
                            tryAwaitRelease()
                            isPressed = false
                        },
                        onTap = { onClick() }
                    )
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text.uppercase(),
            style = TextStyle(
                fontFamily = FontFamily.SansSerif,
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp,
                color = SpaceBlack
            )
        )
    }
}
