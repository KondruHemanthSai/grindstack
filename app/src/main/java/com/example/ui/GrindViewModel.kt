package com.example.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.DailyHabits
import com.example.data.GrindRepository
import com.example.data.GroupMember
import com.example.data.Task
import com.example.data.TechLog
import com.example.data.UserProfile
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class GrindViewModel(private val repository: GrindRepository) : ViewModel() {

    val userProfile: StateFlow<UserProfile?> = repository.userProfile
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = null
        )

    val allTasks: StateFlow<List<Task>> = repository.allTasks
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val techLogs: StateFlow<List<TechLog>> = repository.techLogs
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val leaderboard: StateFlow<List<GroupMember>> = repository.leaderboard
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val todayDateStringStringState = MutableStateFlow(repository.getTodayDateString())

    val todayHabits: StateFlow<DailyHabits?> = todayDateStringStringState
        .flatMapLatest { dateStr -> repository.getHabitsForTodayFlow(dateStr) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = null
        )

    val allHabits: StateFlow<List<DailyHabits>> = repository.getAllHabitsFlow()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Dynamic Notifications / Nudges based on active state
    val notificationNudges: StateFlow<List<String>> = combine(allTasks, userProfile, leaderboard) { tasks, profile, peers ->
        val list = mutableListOf<String>()
        
        // Checklist Nudge
        val incomplete = tasks.count { !it.isCompleted }
        if (incomplete == 2) {
            list.add("🔥 Soft Nudge: You're 2 tasks away from 100% completion today!")
        } else if (incomplete == 1) {
            list.add("⚡ Almost There: Just 1 tasks left! Make today a perfect day!")
        } else if (tasks.isNotEmpty() && incomplete == 0) {
            list.add("🎉 Legendary Status: 100% task completion achieved! Streak safe!")
        } else {
            list.add("🔔 Daily reminder: Fill in your checklist tasks and crush your goals!")
        }

        // Streak & Grace Check
        if (profile != null) {
            if (profile.graceDaysUsedThisWeek >= profile.graceDaysAllowedThisWeek) {
                list.add("⚠️ Streak Break Alert: You used your grace day! Missed days will reset your streak to 0!")
            } else {
                list.add("💡 Grace Day available: 1 recovery day is allowed per week configuration.")
            }

            // Competitive Leaderboard Alerts
            if (profile.currentGroupId != null && peers.isNotEmpty()) {
                val leader = peers.firstOrNull { !it.isMe }
                if (leader != null && leader.xp > profile.xp) {
                    val diff = leader.xp - profile.xp
                    list.add("⚔️ Competitive: ${leader.username} is ahead of you by $diff XP! Log study hours to overtake!")
                } else if (peers.any { !it.isMe }) {
                    list.add("👑 Leaderboard Peak: You are currently out-pacing the average in your squad!")
                }
            }
        }
        list
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), listOf("🔔 Daily reminder to complete tasks and build your streak."))

    // Motivational Quote of the Day generator
    val quoteOfTheDay: StateFlow<String> = flowOf(Unit).map {
        val quotes = listOf(
            "“First they ignore you, then they laugh at you, then they fight you, then you win.”",
            "“The only bad workout is the one that didn't happen.”",
            "“Stop speaking. Start writing. Start coding. Your stack doesn't build itself.”",
            "“Discipline is choosing between what you want now and what you want most.”",
            "“Code is like humor. When you have to explain it, it’s bad.”",
            "“Do something today that your future self will thank you for.”",
            "“The hard days are the days when you make the most speed.”"
        )
        val dayIndex = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_YEAR)
        quotes[dayIndex % quotes.size]
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "“Discipline is choosing between what you want now and what you want most.”")

    init {
        checkMidnightReset()
    }

    fun checkMidnightReset() {
        viewModelScope.launch {
            try {
                // Sync user profile from Firestore on startup if logged in
                repository.syncUserProfileFromFirestoreOnStartup()
                repository.checkAndPerformMidnightReset()
                todayDateStringStringState.value = repository.getTodayDateString()
                // Make sure profile and habits exist
                repository.getOrCreateUserProfile()
                repository.prepopulateDefaultHabitsForToday()
                repository.syncLocalToLeaderboard()
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed checkMidnightReset", e)
            }
        }
    }

    fun toggleTask(task: Task, isCompleted: Boolean) {
        viewModelScope.launch {
            try {
                repository.toggleTaskCompletion(task, isCompleted)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed toggleTask", e)
            }
        }
    }

    fun addCustomTask(name: String, category: String) {
        viewModelScope.launch {
            try {
                repository.createCustomTask(name, category)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed addCustomTask", e)
            }
        }
    }

    fun deleteCustomTask(task: Task) {
        viewModelScope.launch {
            try {
                repository.deleteCustomTask(task)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed deleteCustomTask", e)
            }
        }
    }

    fun addTechLog(topic: String, platform: String, count: Int) {
        viewModelScope.launch {
            try {
                repository.logTechStudy(topic, platform, count)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed addTechLog", e)
            }
        }
    }

    fun updateProfile(username: String, avatar: String) {
        viewModelScope.launch {
            try {
                repository.updateProfileInfo(username, avatar)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed updateProfile", e)
            }
        }
    }

    fun syncUserProfile(username: String, profilePic: String, xp: Int, streak: Int, groupId: String? = null, groupName: String? = null) {
        viewModelScope.launch {
            try {
                repository.syncUserProfileAfterLogin(username, profilePic, xp, streak, groupId, groupName)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed syncUserProfile", e)
            }
        }
    }

    fun toggleDailyHabit(habitType: String, isChecked: Boolean) {
        viewModelScope.launch {
            try {
                val habits = todayHabits.value ?: DailyHabits(dateString = repository.getTodayDateString())
                val updated = when (habitType) {
                    "gym" -> habits.copy(gymCompleted = isChecked)
                    "diet" -> habits.copy(dietCompleted = isChecked)
                    "skincare" -> habits.copy(skincareCompleted = isChecked)
                    "sleep" -> habits.copy(sleepCompleted = isChecked)
                    else -> habits
                }
                repository.saveDailyHabits(updated)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed toggleDailyHabit", e)
            }
        }
    }

    fun saveSleepSchedule(bedtime: String, wakeTime: String) {
        viewModelScope.launch {
            try {
                val habits = todayHabits.value ?: DailyHabits(dateString = repository.getTodayDateString())
                
                // Parse and calculate duration
                val sdf = java.text.SimpleDateFormat("HH:mm", java.util.Locale.US)
                val bedDate = try { sdf.parse(bedtime) } catch (e: Exception) { null }
                val wakeDate = try { sdf.parse(wakeTime) } catch (e: Exception) { null }
                
                var isSleepGoalMet = habits.sleepCompleted
                if (bedDate != null && wakeDate != null) {
                    var diff = wakeDate.time - bedDate.time
                    if (diff < 0) diff += 24 * 60 * 60 * 1000 // Cross midnight
                    val hours = diff.toFloat() / (1000 * 60 * 60)
                    isSleepGoalMet = hours >= 7f
                }

                val updated = habits.copy(
                    bedtime = bedtime, 
                    wakeTime = wakeTime,
                    sleepCompleted = isSleepGoalMet
                )
                repository.saveDailyHabits(updated)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed saveSleepSchedule", e)
            }
        }
    }

    fun saveDisciplineToggles(screenTime: Boolean, limitedEnt: Boolean) {
        viewModelScope.launch {
            try {
                val habits = todayHabits.value ?: DailyHabits(dateString = repository.getTodayDateString())
                val updated = habits.copy(screenTimeGoalToggled = screenTime, limitedEntToggled = limitedEnt)
                repository.saveDailyHabits(updated)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed saveDisciplineToggles", e)
            }
        }
    }

    fun joinGroup(groupId: String, groupName: String) {
        viewModelScope.launch {
            try {
                repository.joinGroup(groupId, groupName)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed joinGroup", e)
            }
        }
    }

    fun leaveGroup() {
        viewModelScope.launch {
            try {
                repository.leaveGroup()
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed leaveGroup", e)
            }
        }
    }

    fun syncSquadMembers(groupId: String) {
        viewModelScope.launch {
            try {
                repository.syncSquadMembers(groupId)
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed syncSquadMembers", e)
            }
        }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            try {
                repository.clearAllData()
                onComplete()
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed logout clearing database", e)
                onComplete()
            }
        }
    }

    fun resetHeatmap() {
        viewModelScope.launch {
            try {
                repository.resetHeatmap()
            } catch (e: Exception) {
                Log.e("GrindViewModel", "Failed resetHeatmap", e)
            }
        }
    }
}
