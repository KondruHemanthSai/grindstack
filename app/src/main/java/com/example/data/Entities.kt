package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: Int = 1,
    val username: String = "Grinder",
    val profilePic: String = "avatar_1", // avatar_1, avatar_2, etc.
    val xp: Int = 0,
    val badgeCount: Int = 0,
    val graceDaysAllowedThisWeek: Int = 1,
    val graceDaysUsedThisWeek: Int = 0,
    val currentGroupId: String? = null,
    val currentGroupName: String? = null,
    val lastResetDateString: String = "",
    val longestStreak: Int = 0,
    val totalTasksCompletedAllTime: Int = 0,
    val routineStreak: Int = 0
)

@Entity(tableName = "tasks")
data class Task(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val category: String, // "custom", "health", "discipline", "tech"
    val isCompleted: Boolean = false,
    val isCustom: Boolean = false,
    val streak: Int = 0,
    val lastCompletedDate: String? = null
)

@Entity(tableName = "tech_logs")
data class TechLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val topic: String, // "Problem Solving", "Web Dev", "Python", "Java", "CRT", "Striver's DSA Sheet"
    val platform: String, // LeetCode / CodeChef / Smart Interviews / Striver's Sheet
    val count: Int,
    val dateString: String,
    val xpEarned: Int
)

@Entity(tableName = "daily_habits")
data class DailyHabits(
    @PrimaryKey val dateString: String, // e.g. "2026-05-25"
    // Health checkboxes
    val gymCompleted: Boolean = false,
    val dietCompleted: Boolean = false,
    val skincareCompleted: Boolean = false,
    val sleepCompleted: Boolean = false, // 7 hrs sleep
    // Sleep Log
    val bedtime: String? = null, // e.g. "22:30"
    val wakeTime: String? = null, // e.g. "06:30"
    // Discipline
    val screenTimeGoalToggled: Boolean = false,
    val limitedEntToggled: Boolean = false
)

@Entity(tableName = "group_members")
data class GroupMember(
    @PrimaryKey val userId: String = "",
    val username: String = "",
    val dailyCompletionPercentage: Float = 0f, // 0f to 100f
    val currentStreak: Int = 0,
    val totalTasksAllTime: Int = 0,
    val xp: Int = 0,
    val profilePic: String = "",
    val activeBreakdown: String = "", // comma-separated tasks completed
    val isMe: Boolean = false,
    val lastSyncTime: Long = System.currentTimeMillis()
)
