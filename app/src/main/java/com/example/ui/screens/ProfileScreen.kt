package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.Task
import com.example.ui.GrindViewModel
import com.example.ui.theme.*

@Composable
fun ProfileScreen(
    viewModel: GrindViewModel,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val profile by viewModel.userProfile.collectAsStateWithLifecycle()
    val tasks by viewModel.allTasks.collectAsStateWithLifecycle()
    val customTasks = remember(tasks) { tasks.filter { it.isCustom } }

    var usernameInput by remember(profile?.username) { mutableStateOf(profile?.username ?: "") }
    var isEditingName by remember { mutableStateOf(false) }
    
    var newTaskName by remember { mutableStateOf("") }
    var newTaskCategory by remember { mutableStateOf("tech") }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .glassBackground()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 90.dp)
    ) {
        // Title
        item {
            Column {
                Text(
                    text = "USER PROFILE",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        fontSize = 22.sp
                    )
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Manage your identity, design custom tasks, or switch accounts.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary)
                )
            }
        }

        // Account Details Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard()
                    .padding(horizontal = 20.dp, vertical = 24.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Avatar Display
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.03f))
                            .border(2.dp, AccentOrange, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = getAvatarEmoji(profile?.profilePic),
                            fontSize = 36.sp
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Username Editor
                    if (isEditingName) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = usernameInput,
                                onValueChange = { if (it.length <= 15) usernameInput = it },
                                modifier = Modifier.weight(1f).heightIn(min = 44.dp),
                                textStyle = TextStyle(textAlign = TextAlign.Center, color = TextPrimary, fontSize = 15.sp),
                                shape = RoundedCornerShape(10.dp),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = AccentOrange,
                                    unfocusedBorderColor = CardBorder,
                                    focusedContainerColor = Color.White.copy(alpha = 0.02f),
                                    unfocusedContainerColor = Color.Transparent
                                )
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(AccentOrange)
                                    .clickable {
                                        viewModel.updateProfile(usernameInput, profile?.profilePic ?: "avatar_1")
                                        isEditingName = false
                                    }
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("SAVE", color = SpaceBlack, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = profile?.username ?: "Grinder",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                    fontSize = 18.sp
                                )
                            )
                            IconButton(
                                onClick = { isEditingName = true },
                                modifier = Modifier.size(24.dp).background(Color.White.copy(alpha = 0.03f), RoundedCornerShape(4.dp))
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextPrimary, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                    
                    Text(
                        text = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.email ?: "Guest Mode",
                        style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary, fontSize = 13.sp),
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Avatar Picker
                    Text(
                        text = "CHOOSE PROFILE AVATAR",
                        style = MaterialTheme.typography.labelSmall.copy(color = TextMuted, letterSpacing = 0.5.sp, fontSize = 11.sp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        listOf("avatar_1", "avatar_2", "avatar_3", "avatar_4").forEach { avatarId ->
                            val isSelected = profile?.profilePic == avatarId
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isSelected) AccentOrange.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.01f))
                                    .border(1.dp, if (isSelected) AccentOrange else CardBorder, RoundedCornerShape(10.dp))
                                    .clickable { viewModel.updateProfile(profile?.username ?: "", avatarId) },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(getAvatarEmoji(avatarId), fontSize = 22.sp)
                            }
                        }
                    }
                }
            }
        }

        // Custom Task Designer Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassCard()
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text(
                        text = "CUSTOM TASK DESIGNER",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontSize = 11.sp,
                            color = TextSecondary,
                            letterSpacing = 0.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    )
                    
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("TASK NAME", style = MaterialTheme.typography.labelSmall.copy(color = TextSecondary, fontSize = 11.sp))
                        OutlinedTextField(
                            value = newTaskName,
                            onValueChange = { newTaskName = it },
                            placeholder = { Text("e.g. Read 1 chapter of system design", color = TextMuted) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TextPrimary,
                                unfocusedBorderColor = CardBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary
                            )
                        )
                    }

                    DropdownSelector(
                        label = "TASK CATEGORY", 
                        options = listOf("Tech Grind", "Health & Fitness", "Daily Discipline"), 
                        selected = when(newTaskCategory) {
                            "tech" -> "Tech Grind"
                            "health" -> "Health & Fitness"
                            else -> "Daily Discipline"
                        },
                        onSelect = { selected: String ->
                            newTaskCategory = when(selected) {
                                "Tech Grind" -> "tech"
                                "Health & Fitness" -> "health"
                                else -> "discipline"
                            }
                        }
                    )

                    GrindButton(
                        text = "CREATE CUSTOM TASK",
                        onClick = {
                            if (newTaskName.isNotBlank()) {
                                viewModel.addCustomTask(newTaskName.trim(), newTaskCategory)
                                newTaskName = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = { viewModel.resetHeatmap() },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
                    ) {
                        Text("RESET CONSISTENCY HEATMAP", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    
                    if (customTasks.isNotEmpty()) {
                        HorizontalDivider(thickness = 0.5.dp, color = Color.White.copy(alpha = 0.05f))
                        Text(
                            text = "YOUR CUSTOM TASKS",
                            style = MaterialTheme.typography.labelSmall.copy(color = TextSecondary, letterSpacing = 0.5.sp)
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            customTasks.forEach { task ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color.White.copy(alpha = 0.01f), RoundedCornerShape(10.dp))
                                        .border(1.dp, CardBorder, RoundedCornerShape(10.dp))
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(task.name, style = MaterialTheme.typography.bodyMedium.copy(color = TextPrimary, fontSize = 14.sp))
                                    Text(
                                        text = "DELETE",
                                        style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFFF87171).copy(alpha = 0.8f), fontWeight = FontWeight.Bold),
                                        modifier = Modifier.clickable { viewModel.deleteCustomTask(task) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Logout Action
        item {
            val user = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
            if (user != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color.Transparent)
                        .border(1.dp, Color(0xFFF87171).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                        .clickable { onLogout() }
                        .padding(horizontal = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "LOGOUT & SWITCH ACCOUNT",
                        style = TextStyle(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp,
                            color = Color(0xFFF87171)
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun CustomTaskManageRow(
    task: Task,
    onDelete: () -> Unit
) {
    val pillConfig = when (task.category.lowercase()) {
        "tech" -> Pair(TechPillBg, TechPillText)
        "health" -> Pair(HealthPillBg, HealthPillText)
        else -> Pair(DisciplinePillBg, DisciplinePillText)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 64.dp)
            .glassCard(shape = RoundedCornerShape(16.dp), borderAlpha = 0.08f)
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Category Pill
                Box(
                    modifier = Modifier
                        .background(pillConfig.first, RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = task.category.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = pillConfig.second
                        )
                    )
                }

                // Task Name
                Text(
                    text = task.name,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        color = WarmAccentWhite
                    )
                )
            }

            IconButton(
                onClick = onDelete,
                modifier = Modifier
                    .testTag("delete_task_btn_${task.id}")
                    .background(Color(0x0AFFFFFF), CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete Custom Task",
                    tint = Color.Red,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun DropdownSelector(label: String, options: List<String>, selected: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = TextSecondary, fontSize = 11.sp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(10.dp))
                .border(1.dp, CardBorder, RoundedCornerShape(10.dp))
                .clickable { expanded = true }
                .padding(12.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(selected, style = MaterialTheme.typography.bodyLarge.copy(color = TextPrimary))
                Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = TextSecondary)
            }
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.background(SpaceBlack).border(1.dp, CardBorder, RoundedCornerShape(8.dp))
            ) {
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option, color = TextPrimary) },
                        onClick = {
                            onSelect(option)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}

private fun getAvatarEmoji(avatarId: String?): String {
    return when (avatarId) {
        "avatar_1" -> "🧑‍💻"
        "avatar_2" -> "🦁"
        "avatar_3" -> "🥋"
        "avatar_4" -> "🚀"
        else -> "🚀"
    }
}

