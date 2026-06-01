package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.TechLog
import com.example.ui.GrindViewModel
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TechScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val techLogs by viewModel.techLogs.collectAsStateWithLifecycle()

    val subjects = listOf("Problem Solving", "Web Dev", "Python", "Java", "CRT", "Striver's DSA Sheet")
    val platforms = listOf("LeetCode", "CodeChef", "Smart Interviews", "Striver's Sheet")

    var selectedSubject by remember { mutableStateOf(subjects[0]) }
    var selectedPlatform by remember { mutableStateOf(platforms[0]) }
    var countInput by remember { mutableStateOf("") }
    var showSubjectDropdown by remember { mutableStateOf(false) }
    var showPlatformDropdown by remember { mutableStateOf(false) }

    val subjectTargets = remember {
        mapOf(
            "Problem Solving" to 200,
            "Web Dev" to 100,
            "Python" to 60,
            "Java" to 60,
            "CRT" to 120,
            "Striver's DSA Sheet" to 450
        )
    }

    val subjectProgressMap = remember(techLogs) {
        subjects.associateWith { subj ->
            val totalLogCount = techLogs.filter { 
                resolveSubject(it.topic, it.platform) == subj 
            }.sumOf { it.count }
            val target = (subjectTargets[subj] ?: 40).toFloat()
            KeyValuePair(totalLogCount, (totalLogCount / target).coerceAtMost(1.0f))
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 90.dp)
    ) {
        // Page Header
        item {
            Column {
                Text(
                    text = "ACADEMY & CODING",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = WarmAccentWhite
                    )
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Log problems or topics study sessions. Earn 15 XP each.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = MutedWarmWhite)
                )
            }
        }


        // Subjects Progression
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard(shape = RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Text(
                        text = "SUBJECT PROGRESSION",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontSize = 11.sp,
                            color = MutedWarmWhite,
                            letterSpacing = 1.1.sp
                        )
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    subjects.forEach { subj ->
                        val progressData = subjectProgressMap[subj] ?: KeyValuePair(0, 0f)
                        Column(modifier = Modifier.padding(vertical = 8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = subj,
                                    style = MaterialTheme.typography.bodyLarge.copy(
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = WarmAccentWhite
                                    )
                                )
                                Text(
                                    text = "${progressData.count} of ${subjectTargets[subj] ?: 40}",
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        fontSize = 13.sp,
                                        color = MutedWarmWhite,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            // Spec: Progress bars: 6px height, 8px radius, background rgba(255,255,255,0.08), fill color #f5f0e8
                            LinearProgressIndicator(
                                progress = { progressData.pct },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(8.dp)),
                                color = WarmAccentWhite,
                                trackColor = Color(0x14FFFFFF)
                            )
                        }
                    }
                }
            }
        }

        // Log input form section (frosted glass card)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard(shape = RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Text(
                        text = "LOG NEW CODING ATTACK",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontSize = 11.sp,
                            color = MutedWarmWhite,
                            letterSpacing = 1.1.sp
                        )
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    // Subject Dropdown
                    Box(modifier = Modifier.fillMaxWidth()) {
                        ExposedDropdownMenuBox(
                            expanded = showSubjectDropdown,
                            onExpandedChange = { showSubjectDropdown = !showSubjectDropdown }
                        ) {
                            OutlinedTextField(
                                value = selectedSubject,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Subject / Topic", color = TextGray) },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showSubjectDropdown) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor()
                                    .testTag("tech_subject_input"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = WarmAccentWhite,
                                    unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                                    focusedLabelColor = WarmAccentWhite,
                                    unfocusedLabelColor = TextGray,
                                    focusedTextColor = WarmAccentWhite,
                                    unfocusedTextColor = WarmAccentWhite
                                )
                            )
                            ExposedDropdownMenu(
                                expanded = showSubjectDropdown,
                                onDismissRequest = { showSubjectDropdown = false },
                                modifier = Modifier
                                    .background(SpaceBlack)
                                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                            ) {
                                subjects.forEach { subj ->
                                    DropdownMenuItem(
                                        text = { Text(subj, color = WarmAccentWhite) },
                                        onClick = {
                                            selectedSubject = subj
                                            showSubjectDropdown = false
                                        },
                                        modifier = Modifier.background(SpaceBlack)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Platform Dropdown
                    Box(modifier = Modifier.fillMaxWidth()) {
                        ExposedDropdownMenuBox(
                            expanded = showPlatformDropdown,
                            onExpandedChange = { showPlatformDropdown = !showPlatformDropdown }
                        ) {
                            OutlinedTextField(
                                value = selectedPlatform,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Platform", color = TextGray) },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showPlatformDropdown) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor()
                                    .testTag("tech_platform_input"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = WarmAccentWhite,
                                    unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                                    focusedLabelColor = WarmAccentWhite,
                                    unfocusedLabelColor = TextGray,
                                    focusedTextColor = WarmAccentWhite,
                                    unfocusedTextColor = WarmAccentWhite
                                )
                            )
                            ExposedDropdownMenu(
                                expanded = showPlatformDropdown,
                                onDismissRequest = { showPlatformDropdown = false },
                                modifier = Modifier
                                    .background(SpaceBlack)
                                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                            ) {
                                platforms.forEach { plat ->
                                    DropdownMenuItem(
                                        text = { Text(plat, color = WarmAccentWhite) },
                                        onClick = {
                                            selectedPlatform = plat
                                            showPlatformDropdown = false
                                        },
                                        modifier = Modifier.background(SpaceBlack)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Count Input
                    OutlinedTextField(
                        value = countInput,
                        onValueChange = { countInput = it },
                        label = { Text("Problems or Modules Solved", color = TextGray) },
                        placeholder = { Text("e.g. 3", color = TextGray.copy(alpha = 0.3f)) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("tech_count_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WarmAccentWhite,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                            focusedLabelColor = WarmAccentWhite,
                            unfocusedLabelColor = TextGray,
                            focusedTextColor = WarmAccentWhite,
                            unfocusedTextColor = WarmAccentWhite
                        )
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Submit Button via GrindButton
                    GrindButton(
                        text = "LOG WORK & EARN +15 XP",
                        onClick = {
                            val count = countInput.trim().toIntOrNull() ?: 1
                            viewModel.addTechLog(selectedSubject, selectedPlatform, count)
                            countInput = ""
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("submit_log_btn")
                    )
                }
            }
        }

        // Log History title
        item {
            Text(
                text = "LOG HISTORY",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontSize = 11.sp,
                    color = MutedWarmWhite,
                    letterSpacing = 1.1.sp
                ),
                modifier = Modifier.padding(top = 12.dp)
            )
        }

        // History logs lists
        if (techLogs.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No technical study logs recorded yet today.",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = MutedWarmWhite,
                            fontSize = 13.sp
                        )
                    )
                }
            }
        } else {
            items(techLogs) { log ->
                TechLogItemRow(log = log)
            }
        }
    }
}

@Composable
fun TechLogItemRow(log: TechLog) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Code,
                    contentDescription = "Code icon",
                    tint = MutedWarmWhite,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = log.topic,
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = WarmAccentWhite
                        )
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${log.platform} • ${log.count} problems finished",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontSize = 11.sp,
                            color = MutedWarmWhite
                        )
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "+${log.xpEarned} XP",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontSize = 13.sp,
                        color = WarmAccentWhite,
                        fontWeight = FontWeight.SemiBold
                    )
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = log.dateString,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontSize = 11.sp,
                        color = MutedWarmWhite
                    )
                )
            }
        }
        HorizontalDivider(thickness = 0.5.dp, color = Color(0x14FFFFFF))
    }
}

data class KeyValuePair(val count: Int, val pct: Float)

private fun resolveSubject(topic: String, platform: String): String {
    val topicLower = topic.lowercase(java.util.Locale.getDefault()).trim()
    val platformLower = platform.lowercase(java.util.Locale.getDefault()).trim()

    return when {
        // 1. Striver's DSA Sheet
        topicLower.contains("striver") || platformLower.contains("striver") || platformLower.contains("sheet") -> "Striver's DSA Sheet"
        
        // 2. CRT
        topicLower.contains("crt") || 
        topicLower.contains("smart") || 
        topicLower.contains("interview") || 
        platformLower.contains("smart") || 
        platformLower.contains("interview") -> "CRT"
        
        // 3. Web Dev
        topicLower.contains("web") || 
        topicLower.contains("html") || 
        topicLower.contains("css") || 
        topicLower.contains("js") || 
        topicLower.contains("javascript") || 
        topicLower.contains("react") || 
        topicLower.contains("node") || 
        platformLower.contains("web") -> "Web Dev"
        
        // 4. Python
        topicLower.contains("python") || 
        topicLower.contains("django") || 
        topicLower.contains("flask") || 
        topicLower.contains("numpy") || 
        topicLower.contains("pandas") || 
        topicLower.contains("py") -> "Python"
        
        // 5. Java
        topicLower.contains("java") && !topicLower.contains("javascript") && !topicLower.contains("js") -> "Java"
        
        // 6. Problem Solving (Default, or if matches LeetCode, CodeChef, etc.)
        topicLower.contains("problem") || 
        topicLower.contains("solving") || 
        topicLower.contains("dsa") || 
        topicLower.contains("leetcode") || 
        topicLower.contains("codechef") || 
        platformLower.contains("leetcode") || 
        platformLower.contains("codechef") -> "Problem Solving"
        
        // Match exact subject names case-insensitively
        else -> {
            val matchedSubject = listOf("Problem Solving", "Web Dev", "Python", "Java", "CRT", "Striver's DSA Sheet")
                .firstOrNull { it.equals(topicLower, ignoreCase = true) }
            matchedSubject ?: "Problem Solving" // Default to Problem Solving
        }
    }
}

@Composable
fun PomodoroTimerWidget(
    onSessionFinished: (Int) -> Unit
) {
    var timerPreset by remember { mutableIntStateOf(25) }
    var timerSeconds by remember { mutableIntStateOf(25 * 60) }
    var timerActive by remember { mutableStateOf(false) }

    LaunchedEffect(timerActive, timerSeconds) {
        if (timerActive && timerSeconds > 0) {
            kotlinx.coroutines.delay(1000)
            timerSeconds -= 1
        } else if (timerActive && timerSeconds == 0) {
            timerActive = false
            onSessionFinished(timerPreset)
            timerSeconds = timerPreset * 60
        }
    }

    val formatTime = remember(timerSeconds) {
        val mins = timerSeconds / 60
        val secs = timerSeconds % 60
        String.format(java.util.Locale.US, "%02d:%02d", mins, secs)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "GRIND POMODORO TIMER",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontSize = 11.sp,
                    color = MutedWarmWhite,
                    letterSpacing = 1.1.sp
                )
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = formatTime,
                style = TextStyle(
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 48.sp,
                    color = WarmAccentWhite,
                    letterSpacing = 2.sp
                ),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))

            // Preset selectors
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                listOf(15, 25, 45, 60).forEach { mins ->
                    val isSelected = timerPreset == mins
                    Box(
                        modifier = Modifier
                            .background(
                                color = if (isSelected) TechPillBg else Color.Transparent,
                                shape = RoundedCornerShape(6.dp)
                              )
                            .border(
                                width = 1.dp,
                                color = if (isSelected) OrangerRed else Color.White.copy(alpha = 0.08f),
                                shape = RoundedCornerShape(6.dp)
                            )
                            .clickable {
                                timerPreset = mins
                                timerSeconds = mins * 60
                                timerActive = false
                            }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "${mins}m",
                            style = MaterialTheme.typography.labelMedium.copy(
                                color = if (isSelected) OrangerRed else WarmAccentWhite,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Actions
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(WarmAccentWhite)
                        .clickable { timerActive = !timerActive },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (timerActive) "PAUSE" else "START",
                        style = TextStyle(
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = SpaceBlack
                        )
                    )
                }

                Box(
                    modifier = Modifier
                        .height(52.dp)
                        .glassCard(shape = RoundedCornerShape(10.dp))
                        .clickable {
                            timerActive = false
                            timerSeconds = timerPreset * 60
                        }
                        .padding(horizontal = 20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "RESET",
                        style = TextStyle(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 15.sp,
                            color = WarmAccentWhite
                        )
                    )
                }
            }
        }
    }
}
