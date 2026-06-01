package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.DailyHabits
import com.example.ui.GrindViewModel
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun HealthScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val habitsOpt by viewModel.todayHabits.collectAsStateWithLifecycle()
    val todayDateStr by viewModel.todayDateStringStringState.collectAsStateWithLifecycle()
    val habits = habitsOpt ?: DailyHabits(dateString = todayDateStr)

    var bedtimeInput by remember(habits.bedtime) { mutableStateOf(habits.bedtime ?: "22:30") }
    var wakeTimeInput by remember(habits.wakeTime) { mutableStateOf(habits.wakeTime ?: "06:30") }

    val habitCount = listOf(habits.gymCompleted, habits.dietCompleted, habits.skincareCompleted, habits.sleepCompleted).count { it }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 90.dp)
    ) {
        // Module Header
        item {
            Column {
                Text(
                    text = "WELLBEING & HEALTH",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = WarmAccentWhite
                    )
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Maintain physical and mental resilience. Check daily items to stay primed.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = MutedWarmWhite)
                )
            }
        }

        // Section Label
        item {
            Text(
                text = "HEALTH CHECKLIST",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontSize = 11.sp,
                    color = MutedWarmWhite,
                    letterSpacing = 0.5.sp,
                    fontWeight = FontWeight.Bold
                )
            )
        }

        // Individual Health Checklist Items (each in its own glass card)
        item {
            val items = listOf(
                HabitItemInfo("gym", "Gym / Workout session", "", habits.gymCompleted, "gym_checkbox"),
                HabitItemInfo("diet", "Diet (Clean nutritious eating)", "", habits.dietCompleted, "diet_checkbox"),
                HabitItemInfo("skincare", "Skincare routine (AM & PM)", "", habits.skincareCompleted, "skincare_checkbox"),
                HabitItemInfo("sleep", "7+ Hours of Sleep", "", habits.sleepCompleted, "sleep_checkbox")
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items.forEach { item ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassCard(shape = RoundedCornerShape(16.dp))
                            .clickable { viewModel.toggleDailyHabit(item.type, !item.checked) }
                            .padding(horizontal = 18.dp, vertical = 16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Left side: HEALTH badge + title
                            Column(modifier = Modifier.weight(1f)) {
                                // Green HEALTH badge
                                Box(
                                    modifier = Modifier
                                        .background(HealthPillBg, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = "HEALTH",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = HealthPillText
                                        )
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.bodyLarge.copy(
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = WarmAccentWhite
                                    )
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            // Right side: Circle checkbox
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .border(
                                        width = 1.5.dp,
                                        color = if (item.checked) CyberGreen.copy(alpha = 0.6f) else Color.White.copy(alpha = 0.2f),
                                        shape = CircleShape
                                    )
                                    .background(
                                        color = if (item.checked) Color.Transparent else Color.Transparent,
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                if (item.checked) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Checked",
                                        tint = CyberGreen,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Sleep Diary Log Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard(shape = RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Start
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bedtime,
                            contentDescription = "Sleep log",
                            tint = WarmAccentWhite,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "SLEEP DIARY LOG",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontSize = 11.sp,
                                color = MutedWarmWhite,
                                letterSpacing = 1.1.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Large time display row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Bedtime display
                        Column(
                            modifier = Modifier.weight(1f),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "BEDTIME",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 11.sp,
                                    color = TextGray,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                            )
                            Spacer(modifier = Modifier.height(6.dp))

                            val context = androidx.compose.ui.platform.LocalContext.current
                            Text(
                                text = formatTo12h(bedtimeInput),
                                style = TextStyle(
                                    fontFamily = FontFamily.SansSerif,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 28.sp,
                                    color = WarmAccentWhite
                                ),
                                modifier = Modifier.clickable {
                                    val parts = bedtimeInput.split(":")
                                    val hour = parts.getOrNull(0)?.toIntOrNull() ?: 22
                                    val minute = parts.getOrNull(1)?.toIntOrNull() ?: 30
                                    android.app.TimePickerDialog(context, { _, h, m ->
                                        bedtimeInput = String.format(java.util.Locale.US, "%02d:%02d", h, m)
                                    }, hour, minute, false).show()
                                }
                            )
                        }

                        // Wake Time display
                        Column(
                            modifier = Modifier.weight(1f),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "WAKE TIME",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 11.sp,
                                    color = TextGray,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                            )
                            Spacer(modifier = Modifier.height(6.dp))

                            val context = androidx.compose.ui.platform.LocalContext.current
                            Text(
                                text = formatTo12h(wakeTimeInput),
                                style = TextStyle(
                                    fontFamily = FontFamily.SansSerif,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 28.sp,
                                    color = WarmAccentWhite
                                ),
                                modifier = Modifier.clickable {
                                    val parts = wakeTimeInput.split(":")
                                    val hour = parts.getOrNull(0)?.toIntOrNull() ?: 6
                                    val minute = parts.getOrNull(1)?.toIntOrNull() ?: 30
                                    android.app.TimePickerDialog(context, { _, h, m ->
                                        wakeTimeInput = String.format(java.util.Locale.US, "%02d:%02d", h, m)
                                    }, hour, minute, false).show()
                                }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Total Sleep Duration
                    val duration = remember(bedtimeInput, wakeTimeInput) {
                        try {
                            val sdf = java.text.SimpleDateFormat("HH:mm", java.util.Locale.US)
                            val bedDate = sdf.parse(bedtimeInput)
                            val wakeDate = sdf.parse(wakeTimeInput)
                            if (bedDate != null && wakeDate != null) {
                                var diff = wakeDate.time - bedDate.time
                                if (diff < 0) diff += 24 * 60 * 60 * 1000
                                val totalHours = diff.toFloat() / 3600000f
                                String.format(java.util.Locale.US, "%.1f", totalHours)
                            } else "8.0"
                        } catch (e: Exception) { "8.0" }
                    }

                    Text(
                        text = "Total Sleep: $duration hours",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = CyberGreen
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    GrindButton(
                        text = "COMMIT SLEEP SCHEDULE",
                        onClick = { viewModel.saveSleepSchedule(bedtimeInput, wakeTimeInput) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("save_sleep_btn")
                    )
                }
            }
        }

        // Discipline Engine Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard(shape = RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Text(
                        text = "DISCIPLINE ENGINE",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontSize = 11.sp,
                            color = MutedWarmWhite,
                            letterSpacing = 1.1.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    // Screen Time Goal Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.saveDisciplineToggles(
                                    !habits.screenTimeGoalToggled,
                                    habits.limitedEntToggled
                                )
                            }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Screen Time Under Goal Limit",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = WarmAccentWhite
                                )
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Limit recreational screen usage to sub-2 hours.",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontSize = 13.sp,
                                    color = TextGray
                                )
                            )
                        }
                        Switch(
                            checked = habits.screenTimeGoalToggled,
                            onCheckedChange = {
                                viewModel.saveDisciplineToggles(it, habits.limitedEntToggled)
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = SpaceBlack,
                                checkedTrackColor = WarmAccentWhite,
                                uncheckedThumbColor = MutedWarmWhite,
                                uncheckedTrackColor = Color(0x14FFFFFF),
                                uncheckedBorderColor = Color(0x14FFFFFF)
                            ),
                            modifier = Modifier.testTag("screen_time_switch")
                        )
                    }

                    HorizontalDivider(thickness = 0.5.dp, color = Color(0x0AFFFFFF))

                    // Strict Entertainment Caps Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.saveDisciplineToggles(
                                    habits.screenTimeGoalToggled,
                                    !habits.limitedEntToggled
                                )
                            }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Strict Entertainment Caps",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = WarmAccentWhite
                                )
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "No scrolling Reels/YouTube Shorts or Netflix binging.",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontSize = 13.sp,
                                    color = TextGray
                                )
                            )
                        }
                        Switch(
                            checked = habits.limitedEntToggled,
                            onCheckedChange = {
                                viewModel.saveDisciplineToggles(habits.screenTimeGoalToggled, it)
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = SpaceBlack,
                                checkedTrackColor = WarmAccentWhite,
                                uncheckedThumbColor = MutedWarmWhite,
                                uncheckedTrackColor = Color(0x14FFFFFF),
                                uncheckedBorderColor = Color(0x14FFFFFF)
                            ),
                            modifier = Modifier.testTag("entertainment_switch")
                        )
                    }
                }
            }
        }
    }
}

data class HabitItemInfo(
    val type: String,
    val title: String,
    val subtitle: String,
    val checked: Boolean,
    val testTag: String
)

fun formatTo12h(time24: String): String {
    return try {
        val parts = time24.split(":")
        val h = parts[0].toInt()
        val m = parts[1].toInt()
        val suffix = if (h >= 12) "PM" else "AM"
        val h12 = when {
            h == 0 -> 12
            h > 12 -> h - 12
            else -> h
        }
        String.format(java.util.Locale.US, "%d:%02d %s", h12, m, suffix)
    } catch (e: Exception) {
        time24
    }
}
