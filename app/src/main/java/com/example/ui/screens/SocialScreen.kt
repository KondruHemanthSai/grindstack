package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.GroupMember
import com.example.ui.GrindViewModel
import com.example.ui.theme.*

@Composable
fun SocialScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val profile by viewModel.userProfile.collectAsStateWithLifecycle()
    val leaderboard by viewModel.leaderboard.collectAsStateWithLifecycle()

    var groupLinkInput by remember { mutableStateOf("") }
    var groupNameInput by remember { mutableStateOf("") }
    var selectedPlayerForDetails by remember { mutableStateOf<GroupMember?>(null) }
    var isCreatingNewSquad by remember { mutableStateOf(false) }
    var joinLinkError by remember { mutableStateOf<String?>(null) }

    val currentGroupId = profile?.currentGroupId
    LaunchedEffect(currentGroupId) {
        if (currentGroupId != null) {
            viewModel.syncSquadMembers(currentGroupId)
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
        // Module Introduction
        item {
            Column {
                Text(
                    text = "SQUAD TRIBES",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = WarmAccentWhite
                    )
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Join shared hubs via magic links and sync task streaks live with your peers.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = MutedWarmWhite)
                )
            }
        }

        // Check if joined
        if (profile?.currentGroupId == null) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Toggle between Join and Create
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassCard(shape = RoundedCornerShape(16.dp))
                            .padding(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (!isCreatingNewSquad) WarmAccentWhite else Color.Transparent)
                                .clickable { isCreatingNewSquad = false }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "JOIN SQUAD",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = if (!isCreatingNewSquad) SpaceBlack else MutedWarmWhite
                                )
                            )
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isCreatingNewSquad) WarmAccentWhite else Color.Transparent)
                                .clickable { isCreatingNewSquad = true }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "CREATE SQUAD",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = if (isCreatingNewSquad) SpaceBlack else MutedWarmWhite
                                )
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassCard(shape = RoundedCornerShape(16.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    if (isCreatingNewSquad) Icons.Default.AddBusiness else Icons.Default.GroupAdd,
                                    contentDescription = null,
                                    tint = WarmAccentWhite
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (isCreatingNewSquad) "CREATE NEW SQUAD" else "JOIN SQUAD SYNC",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontSize = 11.sp,
                                        color = MutedWarmWhite,
                                        letterSpacing = 1.1.sp
                                    )
                                )
                            }
                            Spacer(modifier = Modifier.height(20.dp))

                            if (isCreatingNewSquad) {
                                OutlinedTextField(
                                    value = groupNameInput,
                                    onValueChange = { groupNameInput = it },
                                    label = { Text("Squad Name", color = TextGray) },
                                    placeholder = { Text("e.g. FAANG 10x Grinders", color = TextGray.copy(alpha = 0.3f)) },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("group_name_input"),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = WarmAccentWhite,
                                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                                        focusedTextColor = WarmAccentWhite,
                                        unfocusedTextColor = WarmAccentWhite
                                    )
                                )
                            } else {
                                OutlinedTextField(
                                    value = groupLinkInput,
                                    onValueChange = {
                                        groupLinkInput = it
                                        joinLinkError = null
                                    },
                                    label = { Text("Invite Link / Magic Connection String", color = TextGray) },
                                    placeholder = { Text("grindstack.app/hub-xplqrs1", color = TextGray.copy(alpha = 0.3f)) },
                                    isError = joinLinkError != null,
                                    supportingText = if (joinLinkError != null) {
                                        { Text(joinLinkError!!, color = MaterialTheme.colorScheme.error) }
                                    } else null,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("group_link_input"),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = WarmAccentWhite,
                                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                                        focusedTextColor = WarmAccentWhite,
                                        unfocusedTextColor = WarmAccentWhite,
                                        errorBorderColor = MaterialTheme.colorScheme.error
                                    )
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            GrindButton(
                                text = if (isCreatingNewSquad) "INITIATE SQUAD" else "JOIN SQUAD",
                                onClick = {
                                    if (isCreatingNewSquad) {
                                        val name = if (groupNameInput.isBlank()) "Standard Grinding Corps" else groupNameInput
                                        val id = "hub-${name.lowercase().replace(" ", "-")}-${(1000..9999).random()}"
                                        viewModel.joinGroup(id, name)
                                    } else {
                                        if (groupLinkInput.isBlank()) {
                                            joinLinkError = "You need an invite link to join a squad. Ask a squad member to share theirs!"
                                        } else {
                                            joinLinkError = null
                                            viewModel.joinGroup(groupLinkInput.trim(), groupLinkInput.trim())
                                        }
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("join_group_btn")
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                text = if (isCreatingNewSquad)
                                    "💡 Pro Tip: Creating a squad generates a unique Magic Link you can share with your team."
                                    else "🔗 Paste an invite link from a squad member to join their tribe.",
                                style = MaterialTheme.typography.bodyMedium.copy(color = TextGray)
                            )
                        }
                    }
                }
            }
        } else {
            // Group Info Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard(shape = RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(WarmAccentWhite, CircleShape)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = profile?.currentGroupName?.uppercase() ?: "SQUAD TRIBES",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        color = WarmAccentWhite,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            
                            val context = androidx.compose.ui.platform.LocalContext.current
                            val groupId = profile?.currentGroupId ?: ""
                            val squadName = profile?.currentGroupName ?: ""
                            
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.clickable {
                                    val sendIntent = android.content.Intent().apply {
                                        action = android.content.Intent.ACTION_SEND
                                        putExtra(android.content.Intent.EXTRA_TEXT, "Join my GrindStack Squad: $squadName\nMagic Link: grindstack.app/$groupId")
                                        type = "text/plain"
                                    }
                                    val shareIntent = android.content.Intent.createChooser(sendIntent, null)
                                    context.startActivity(shareIntent)
                                }
                            ) {
                                Text(
                                    text = "Code ID: $groupId",
                                    style = MaterialTheme.typography.bodyMedium.copy(color = TextGray)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Icon(
                                    Icons.Default.Share,
                                    contentDescription = "Share Link",
                                    tint = TextGray,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                        IconButton(
                            onClick = { viewModel.leaveGroup() },
                            modifier = Modifier
                                .testTag("leave_group_btn")
                                .background(Color(0x0AFFFFFF), RoundedCornerShape(8.dp))
                        ) {
                            Icon(
                                imageVector = Icons.Default.ExitToApp,
                                contentDescription = "Leave Squad",
                                tint = Color.Red
                            )
                        }
                    }
                }
            }

            // Leaderboard Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "LEADERBOARD RANKINGS",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontSize = 11.sp,
                            color = MutedWarmWhite,
                            letterSpacing = 1.1.sp
                        )
                    )
                    IconButton(
                        onClick = { profile?.currentGroupId?.let { viewModel.syncSquadMembers(it) } },
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = TextGray,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            // Score explanation metrics
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard(shape = RoundedCornerShape(16.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = "⚖️ Combined score = Daily Done % + Longest Streak * 2 + All-Time Tasks * 0.1",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = MutedWarmWhite,
                            fontSize = 11.sp
                        )
                    )
                }
            }

            if (leaderboard.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Group, contentDescription = null, tint = TextGray.copy(alpha = 0.3f), modifier = Modifier.size(48.dp))
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Your tribe is empty.\nShare the link to recruit grinders!",
                                style = MaterialTheme.typography.bodyMedium.copy(color = TextGray),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            }

            // Leaderboard entries list
            itemsIndexed(leaderboard) { index, member ->
                LeaderboardPlayerRow(
                    rank = index + 1,
                    member = member,
                    onClick = { selectedPlayerForDetails = member }
                )
                Spacer(modifier = Modifier.height(10.dp))
            }
        }
    }

    // Modal inspect popup showing custom user details
    selectedPlayerForDetails?.let { player ->
        AlertDialog(
            onDismissRequest = { selectedPlayerForDetails = null },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .glassCard(shape = RoundedCornerShape(16.dp)),
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(WarmAccentWhite, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = getAvatarEmoji(player.profilePic),
                            style = TextStyle(
                                fontSize = 18.sp
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = player.username,
                        color = WarmAccentWhite,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Metrics Grid Row
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassCard(shape = RoundedCornerShape(16.dp))
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            MetricColumn(label = "DAILY DONE", value = "${player.dailyCompletionPercentage.toInt()}%")
                            MetricColumn(label = "STREAK", value = "🔥 ${player.currentStreak}d")
                            MetricColumn(label = "ALL-TIME", value = "🏅 ${player.totalTasksAllTime}")
                        }
                    }

                    Text(
                        text = "ACTIVE DONE TASKS:",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            color = MutedWarmWhite,
                            letterSpacing = 1.sp
                        )
                    )

                    val tasksCompleted = player.activeBreakdown.split(",").filter { it.isNotBlank() }
                    if (tasksCompleted.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .glassCard(shape = RoundedCornerShape(16.dp))
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No tasks completed yet today.",
                                color = TextGray,
                                fontSize = 13.sp
                            )
                        }
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            tasksCompleted.forEach { taskName ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = "Completed", tint = WarmAccentWhite, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(taskName, color = WarmAccentWhite, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedPlayerForDetails = null }) {
                    Text("CLOSE", color = WarmAccentWhite, fontWeight = FontWeight.Bold)
                }
            },
            containerColor = SpaceBlack
        )
    }
}

@Composable
fun LeaderboardPlayerRow(
    rank: Int,
    member: GroupMember,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(
                shape = RoundedCornerShape(16.dp),
                borderAlpha = if (member.isMe) 0.35f else 0.08f
            )
            .clickable { onClick() }
            .testTag("leaderboard_row_${member.username}")
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                // Rank Styling as per specification:
                // - 1st: Solid gold badge/accent
                // - 2nd/3rd: Thin accent border
                // - others: muted warm white
                val rankBg = when (rank) {
                    1 -> Color(0xFFFFD700)
                    else -> Color.Transparent
                }
                val rankTextCol = when (rank) {
                    1 -> SpaceBlack
                    else -> Color.White.copy(alpha = 0.5f)
                }
                val rankBorder = when (rank) {
                    1 -> null
                    2 -> BorderStroke(1.dp, Color(0xFFC0C0C0))
                    3 -> BorderStroke(1.dp, Color(0xFFCD7F32))
                    else -> BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                }

                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(rankBg)
                        .then(if (rankBorder != null) Modifier.border(rankBorder, CircleShape) else Modifier),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$rank",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = rankTextCol,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                // User Avatar initials Circle
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(Color(0x14FFFFFF), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = getAvatarEmoji(member.profilePic),
                        style = TextStyle(
                            fontSize = 18.sp
                        )
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Soldier names (spec: 15px medium)
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = member.username,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                color = WarmAccentWhite
                            )
                        )
                        if (member.isMe) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .background(WarmAccentWhite, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "YOU",
                                    style = MaterialTheme.typography.labelSmall.copy(color = SpaceBlack, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${member.totalTasksAllTime} tasks • ${member.xp} XP",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextGray, fontSize = 12.sp)
                    )
                }
            }

            // Statistics column on right
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${member.dailyCompletionPercentage.toInt()}%",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = WarmAccentWhite,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        text = "DONE TODAY",
                        style = MaterialTheme.typography.labelSmall.copy(color = TextGray, fontSize = 8.sp)
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "🔥 ${member.currentStreak}d",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = DisciplinePillText,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        text = "STREAK",
                        style = MaterialTheme.typography.labelSmall.copy(color = TextGray, fontSize = 8.sp)
                    )
                }
            }
        }
    }
}

@Composable
fun MetricColumn(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelSmall.copy(color = TextGray, fontSize = 9.sp))
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = value, style = MaterialTheme.typography.titleMedium.copy(color = WarmAccentWhite, fontWeight = FontWeight.Bold, fontSize = 16.sp))
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

