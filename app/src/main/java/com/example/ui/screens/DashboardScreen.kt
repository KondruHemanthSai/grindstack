package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.Task
import com.example.ui.GrindViewModel
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val profile by viewModel.userProfile.collectAsStateWithLifecycle()
    val tasks by viewModel.allTasks.collectAsStateWithLifecycle()
    val habitsHistory by viewModel.allHabits.collectAsStateWithLifecycle()
    val nudges by viewModel.notificationNudges.collectAsStateWithLifecycle()
    val quote by viewModel.quoteOfTheDay.collectAsStateWithLifecycle()

    var showNudgesDialog by remember { mutableStateOf(false) }
    var taskToLogComplete by remember { mutableStateOf<Task?>(null) }

    val totalChecklist = tasks.size
    val completedChecklist = tasks.count { it.isCompleted }
    val progressPercent = if (totalChecklist > 0) {
        (completedChecklist.toFloat() / totalChecklist * 100).toInt()
    } else {
        0
    }

    val techTasks = remember(tasks) { tasks.filter { it.category.lowercase() == "tech" } }
    val healthTasks = remember(tasks) { tasks.filter { it.category.lowercase() == "health" } }
    val disciplineTasks = remember(tasks) { 
        tasks.filter { it.category.lowercase() == "discipline" || (it.category.lowercase() != "tech" && it.category.lowercase() != "health") }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 90.dp)
    ) {
        // Welcome and Streak HUD Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Hey, ${profile?.username ?: "Grinder"}",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = WarmAccentWhite,
                            fontSize = 22.sp
                        )
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Streak: ${profile?.longestStreak ?: 0} days",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = TextGray
                        )
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val level = ((profile?.xp ?: 0) / 100) + 1
                    Box(
                        modifier = Modifier
                            .background(DisciplinePillBg, RoundedCornerShape(20.dp))
                            .border(1.dp, DisciplinePillText.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "LVL $level",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = DisciplinePillText
                            )
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(TechPillBg, RoundedCornerShape(20.dp))
                            .border(1.dp, TechPillText.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "${profile?.xp ?: 0} XP",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = TechPillText
                            )
                        )
                    }
                }
            }
        }

        // Circular Progress + Quote Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard(shape = RoundedCornerShape(16.dp))
                    .padding(horizontal = 20.dp, vertical = 20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "DAILY PROGRESS",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 11.sp,
                                color = MutedWarmWhite,
                                letterSpacing = 1.sp
                            )
                        )
                        Text(
                            text = "Reclaim your focus",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = WarmAccentWhite
                            )
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "\"$quote\"",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontSize = 13.sp,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                color = MutedWarmWhite
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(110.dp)
                    ) {
                        CircularProgressIndicator(
                            progress = { progressPercent / 100f },
                            modifier = Modifier.size(100.dp),
                            color = OrangerRed,
                            strokeWidth = 3.dp,
                            trackColor = Color(0x10FFFFFF)
                        )
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "$completedChecklist/$totalChecklist",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    color = WarmAccentWhite,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                )
                            )
                            Text(
                                text = "Tasks Done",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.sp,
                                    color = MutedWarmWhite
                                )
                            )
                        }
                    }
                }
            }
        }

        // Live Notification Banner
        item {
            val primaryNudge = nudges.firstOrNull() ?: "🔔 Keep pushing your limits! Logging tasks increases your place on the ladder."
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard(shape = RoundedCornerShape(16.dp))
                    .clickable { showNudgesDialog = true }
                    .padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "Alert Indicator",
                        tint = WarmAccentWhite,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = primaryNudge,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = WarmAccentWhite,
                            fontSize = 13.sp
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Task Sections (Categorized like Web) - Moved UP
        if (tasks.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.PlaylistAddCheck,
                            contentDescription = "Empty Tasks",
                            tint = MutedWarmWhite,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "No active tasks. Build custom goals in your Profile!",
                            style = MaterialTheme.typography.bodyMedium.copy(color = TextGray),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }

        // TECH SECTION
        if (techTasks.isNotEmpty()) {
            item {
                TaskCategoryCard(
                    title = "TECH GRIND",
                    accentColor = AccentOrange,
                    badgeColor = TechPillBg,
                    tasks = techTasks,
                    onToggle = { task, checked ->
                        if (checked) taskToLogComplete = task else viewModel.toggleTask(task, false)
                    }
                )
            }
        }

        // HEALTH SECTION
        if (healthTasks.isNotEmpty()) {
            item {
                TaskCategoryCard(
                    title = "HEALTH & FITNESS",
                    accentColor = AccentGreen,
                    badgeColor = HealthPillBg,
                    tasks = healthTasks,
                    onToggle = { task, checked ->
                        if (checked) taskToLogComplete = task else viewModel.toggleTask(task, false)
                    }
                )
            }
        }

        // DISCIPLINE SECTION
        if (disciplineTasks.isNotEmpty()) {
            item {
                TaskCategoryCard(
                    title = "DAILY DISCIPLINE",
                    accentColor = AccentPurple,
                    badgeColor = DisciplinePillBg,
                    tasks = disciplineTasks,
                    onToggle = { task, checked ->
                        if (checked) taskToLogComplete = task else viewModel.toggleTask(task, false)
                    }
                )
            }
        }

        // Consistency Heatmap - Moved DOWN
        item {
            HeatmapWidget(habitsHistory = habitsHistory)
        }
    }

    // Modal List Dialog for Nudges / Hub
    if (showNudgesDialog) {
        AlertDialog(
            onDismissRequest = { showNudgesDialog = false },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .glassCard(shape = RoundedCornerShape(16.dp)),
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
            title = {
                Text(
                    text = "GRINDSTACK HUD CENTRAL",
                    style = MaterialTheme.typography.titleMedium.copy(color = WarmAccentWhite)
                )
            },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    nudges.forEach { nudg ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .glassCard(shape = RoundedCornerShape(16.dp))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = nudg,
                                style = MaterialTheme.typography.bodyMedium.copy(color = WarmAccentWhite)
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showNudgesDialog = false }) {
                    Text("DISMISS", color = WarmAccentWhite)
                }
            },
            containerColor = SpaceBlack
        )
    }

    // Logging Task Complete Dialog
    taskToLogComplete?.let { task ->
        TaskCompletionDialog(
            task = task,
            onDismiss = { taskToLogComplete = null },
            onConfirm = {
                viewModel.toggleTask(task, true)
                if (task.category.lowercase() == "tech") {
                    viewModel.addTechLog("Completed: ${task.name}", "LeetCode", 1)
                }
                taskToLogComplete = null
            }
        )
    }
}

@Composable
fun TaskCategoryCard(
    title: String,
    accentColor: Color,
    badgeColor: Color,
    tasks: List<Task>,
    onToggle: (Task, Boolean) -> Unit
) {
    val completed = tasks.count { it.isCompleted }
    val total = tasks.size

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard()
            .padding(18.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = accentColor,
                        letterSpacing = 0.5.sp
                    )
                )
                Box(
                    modifier = Modifier
                        .background(badgeColor.copy(alpha = 0.1f), RoundedCornerShape(20.dp))
                        .border(1.dp, accentColor.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "$completed/$total",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = accentColor
                        )
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                tasks.forEachIndexed { index, task ->
                    val opacity = if (task.isCompleted) 0.5f else 1.0f
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onToggle(task, !task.isCompleted) }
                            .padding(vertical = 10.dp)
                            .alpha(opacity),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Web-style square checkbox
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .border(
                                    width = 1.dp,
                                    color = if (task.isCompleted) accentColor else TextSecondary,
                                    shape = RoundedCornerShape(6.dp)
                                )
                                .background(
                                    color = if (task.isCompleted) accentColor else Color.Transparent,
                                    shape = RoundedCornerShape(6.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (task.isCompleted) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Checked",
                                    tint = SpaceBlack,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        
                        Text(
                            text = task.name,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontSize = 14.sp,
                                color = TextPrimary,
                                textDecoration = if (task.isCompleted) androidx.compose.ui.text.style.TextDecoration.LineThrough else null
                            ),
                            modifier = Modifier.weight(1f)
                        )
                        
                        if (task.streak > 0) {
                            Text(
                                text = "🔥 ${task.streak}",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = accentColor,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }
                    if (index < tasks.size - 1) {
                        HorizontalDivider(thickness = 0.5.dp, color = Color.White.copy(alpha = 0.03f))
                    }
                }
            }
        }
    }
}

@Composable
fun HeatmapWidget(habitsHistory: List<com.example.data.DailyHabits>) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            Text(
                text = "CONSISTENCY HEATMAP (LAST 21 DAYS)",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontSize = 11.sp,
                    color = MutedWarmWhite,
                    letterSpacing = 0.5.sp
                )
            )
            Spacer(modifier = Modifier.height(12.dp))

            val heatmapDays = remember(habitsHistory) {
                val list = mutableListOf<HeatmapDayInfo>()
                val cal = Calendar.getInstance()
                val dateFormat = SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                val todayStr = dateFormat.format(cal.time)
                
                val habitsMap = habitsHistory.associateBy { it.dateString }
                
                // Start from 20 days ago to today
                cal.add(Calendar.DAY_OF_YEAR, -20)
                for (i in 0..20) {
                    val dateStr = dateFormat.format(cal.time)
                    val dayNum = cal.get(Calendar.DAY_OF_MONTH)
                    val habits = habitsMap[dateStr]
                    list.add(
                        HeatmapDayInfo(
                            dateString = dateStr,
                            label = dayNum,
                            isToday = dateStr == todayStr,
                            habits = habits
                        )
                    )
                    cal.add(Calendar.DAY_OF_YEAR, 1)
                }
                list
            }

            // Grid layout: 3 rows of 7 days
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (row in 0 until 3) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        for (col in 0 until 7) {
                            val index = row * 7 + col
                            if (index < heatmapDays.size) {
                                val day = heatmapDays[index]
                                val score = when {
                                    day.habits == null -> 0f
                                    else -> {
                                        var count = 0
                                        if (day.habits.gymCompleted) count++
                                        if (day.habits.dietCompleted) count++
                                        if (day.habits.skincareCompleted) count++
                                        if (day.habits.sleepCompleted) count++
                                        count.toFloat() / 4f
                                    }
                                }

                                val blockColor = when {
                                    score == 0f -> Color.White.copy(alpha = 0.02f)
                                    score <= 0.25f -> AccentGreen.copy(alpha = 0.15f)
                                    score <= 0.5f -> AccentGreen.copy(alpha = 0.3f)
                                    score <= 0.75f -> AccentGreen.copy(alpha = 0.45f)
                                    else -> AccentGreen.copy(alpha = 0.65f)
                                }

                                val isToday = day.isToday
                                val borderStroke = if (isToday) {
                                    androidx.compose.foundation.BorderStroke(1.5.dp, AccentOrange)
                                } else {
                                    androidx.compose.foundation.BorderStroke(0.5.dp, Color.White.copy(alpha = 0.05f))
                                }

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .padding(4.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(blockColor)
                                        .border(borderStroke, RoundedCornerShape(4.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${day.label}",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontSize = 10.sp,
                                            fontWeight = if (score >= 0.75f) FontWeight.Bold else FontWeight.Medium,
                                            color = if (score >= 0.75f) SpaceBlack else TextSecondary
                                        )
                                    )
                                }
                            } else {
                                Spacer(modifier = Modifier.weight(1f).aspectRatio(1f).padding(horizontal = 3.dp))
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            // Legend matching web
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("0 completed", style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, color = TextMuted))
                Spacer(modifier = Modifier.width(6.dp))
                Box(modifier = Modifier.size(10.dp).background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(2.dp)).border(0.5.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(2.dp)))
                Spacer(modifier = Modifier.width(4.dp))
                Box(modifier = Modifier.size(10.dp).background(AccentGreen.copy(alpha = 0.15f), RoundedCornerShape(2.dp)))
                Spacer(modifier = Modifier.width(4.dp))
                Box(modifier = Modifier.size(10.dp).background(AccentGreen.copy(alpha = 0.3f), RoundedCornerShape(2.dp)))
                Spacer(modifier = Modifier.width(4.dp))
                Box(modifier = Modifier.size(10.dp).background(AccentGreen.copy(alpha = 0.45f), RoundedCornerShape(2.dp)))
                Spacer(modifier = Modifier.width(4.dp))
                Box(modifier = Modifier.size(10.dp).background(AccentGreen.copy(alpha = 0.65f), RoundedCornerShape(2.dp)))
                Spacer(modifier = Modifier.width(6.dp))
                Text("4 completed", style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, color = TextMuted))
            }
        }
    }
}

data class HeatmapDayInfo(
    val dateString: String,
    val label: Int,
    val isToday: Boolean,
    val habits: com.example.data.DailyHabits?
)

@Composable
fun TaskCompletionDialog(
    task: Task,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .glassCard(shape = RoundedCornerShape(16.dp)),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Complete Task",
                    tint = WarmAccentWhite,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "CONFIRM COMPLETION",
                    style = MaterialTheme.typography.titleMedium.copy(
                        color = WarmAccentWhite,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                )
            }
        },
        text = {
            Text(
                text = "Mark \"${task.name}\" as completed?",
                style = MaterialTheme.typography.bodyLarge.copy(color = WarmAccentWhite),
                modifier = Modifier.padding(vertical = 12.dp)
            )
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = WarmAccentWhite, contentColor = SpaceBlack),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("dialog_completion_submit_btn")
            ) {
                Text(
                    text = "CONFIRM",
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = SpaceBlack
                    )
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.testTag("dialog_completion_cancel_btn")
            ) {
                Text("CANCEL", color = TextGray)
            }
        },
        containerColor = SpaceBlack
    )
}
