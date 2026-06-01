package com.example.data

import android.content.Context
import android.util.Log
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import com.google.firebase.firestore.firestore
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.tasks.await

class GrindRepository(private val db: AppDatabase) {

    private val userProfileDao = db.userProfileDao()
    private val taskDao = db.taskDao()
    private val techLogDao = db.techLogDao()
    private val dailyHabitsDao = db.dailyHabitsDao()
    private val groupMemberDao = db.groupMemberDao()

    val userProfile: Flow<UserProfile?> = userProfileDao.getUserProfileFlow()
    val allTasks: Flow<List<Task>> = taskDao.getAllTasks()
    val techLogs: Flow<List<TechLog>> = techLogDao.getTechLogsFlow()
    val leaderboard: Flow<List<GroupMember>> = groupMemberDao.getLeaderboardFlow()

    fun getLogsForTopic(topic: String): Flow<List<TechLog>> = techLogDao.getLogsForTopicFlow(topic)
    fun getHabitsForTodayFlow(dateStr: String): Flow<DailyHabits?> = dailyHabitsDao.getHabitsForDateFlow(dateStr)
    fun getAllHabitsFlow(): Flow<List<DailyHabits>> = dailyHabitsDao.getAllHabitsFlow()

    fun getTodayDateString(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }

    suspend fun getOrCreateUserProfile(): UserProfile = withContext(Dispatchers.IO) {
        // Prepopulate default tasks if database is empty on app launch/migration
        prepopulateDefaultTasks()
        prepopulateDefaultHabitsForToday()

        var profile = userProfileDao.getUserProfile()
        if (profile == null) {
            profile = UserProfile(
                username = "Grinder",
                profilePic = "avatar_1",
                xp = 20, // Start with some base XP
                badgeCount = 0,
                lastResetDateString = getTodayDateString()
            )
            userProfileDao.insertOrUpdate(profile)
            syncLocalToLeaderboard()
        }
        profile
    }

    suspend fun resetHeatmap() = withContext(Dispatchers.IO) {
        val today = getTodayDateString()
        val todayHabits = dailyHabitsDao.getHabitsForDate(today)
        dailyHabitsDao.clearAll()
        if (todayHabits != null) {
            dailyHabitsDao.insertOrUpdate(todayHabits)
        }
    }

    suspend fun prepopulateDefaultTasks() = withContext(Dispatchers.IO) {
        // Only prepopulate if tasks are empty
        val list = taskDao.getTasksList()
        if (list.isEmpty()) {
            val defaultTasks = listOf(
                Task(name = "LeetCode Problem of the Day", category = "tech"),
                Task(name = "Striver's DSA Exercise", category = "tech"),
                Task(name = "Go to Gym & workout", category = "health"),
                Task(name = "Eat a nutrition-focused clean diet", category = "health"),
                Task(name = "Complete PM Skincare routine", category = "health"),
                Task(name = "Read Tech or Subject Books (30m)", category = "tech"),
                Task(name = "Perform Daily Routine check", category = "discipline")
            )
            taskDao.insertAll(defaultTasks)
        }
    }

    suspend fun prepopulateDefaultHabitsForToday() = withContext(Dispatchers.IO) {
        val today = getTodayDateString()
        val habits = dailyHabitsDao.getHabitsForDate(today)
        if (habits == null) {
            dailyHabitsDao.insertOrUpdate(
                DailyHabits(
                    dateString = today,
                    gymCompleted = false,
                    dietCompleted = false,
                    skincareCompleted = false,
                    sleepCompleted = false,
                    bedtime = "22:30",
                    wakeTime = "06:30"
                )
            )
        }
    }

    // Checking and doing Midnight task reset
    suspend fun checkAndPerformMidnightReset() = withContext(Dispatchers.IO) {
        val profile = getOrCreateUserProfile()
        val today = getTodayDateString()
        if (profile.lastResetDateString != today) {
            Log.d("GrindRepository", "Performing Midnight Reset from ${profile.lastResetDateString} to $today")
            
            // 1. Process tasks for streak handling
            val currentTasks = taskDao.getTasksList()
            var graceDaysUsedIncrement = 0
            var allowedGrace = profile.graceDaysAllowedThisWeek
            var graceUsedNow = profile.graceDaysUsedThisWeek

            val updatedTasks = currentTasks.map { task ->
                if (task.isCompleted) {
                    // Task was completed! Keep streak going or increment
                    task.copy(
                        isCompleted = false,
                        streak = task.streak + 1,
                        lastCompletedDate = profile.lastResetDateString
                    )
                } else {
                    // Task was NOT completed!
                    // Check if we can use a grace day to save the streak
                    if (allowedGrace > graceUsedNow) {
                        graceUsedNow += 1
                        task.copy(
                            isCompleted = false,
                            // Streak stays, but marked as grace used
                            lastCompletedDate = profile.lastResetDateString
                        )
                    } else {
                        // Reset streak to 0
                        task.copy(
                            isCompleted = false,
                            streak = 0
                        )
                    }
                }
            }
            taskDao.insertAll(updatedTasks)

            // Reset habits for today if not exist
            prepopulateDefaultHabitsForToday()

            // Update user profile with reset
            val newProfile = profile.copy(
                lastResetDateString = today,
                graceDaysUsedThisWeek = graceUsedNow,
                routineStreak = if (updatedTasks.all { !it.isCustom || it.isCompleted }) profile.routineStreak + 1 else 0
            )
            userProfileDao.insertOrUpdate(newProfile)

            // Dynamic sync
            if (profile.currentGroupId != null) {
                syncSquadMembers(profile.currentGroupId)
            }
        }
    }

    suspend fun createCustomTask(name: String, category: String) = withContext(Dispatchers.IO) {
        val task = Task(name = name, category = category, isCompleted = false, isCustom = true)
        taskDao.insertTask(task)
    }

    suspend fun deleteCustomTask(task: Task) = withContext(Dispatchers.IO) {
        if (task.isCustom) {
            taskDao.deleteTask(task)
        }
    }

    suspend fun toggleTaskCompletion(task: Task, isCompleted: Boolean) = withContext(Dispatchers.IO) {
        val updated = task.copy(isCompleted = isCompleted)
        taskDao.insertTask(updated)

        // Award XP
        val profile = getOrCreateUserProfile()
        val xpGain = if (isCompleted) 10 else -10
        val newXp = (profile.xp + xpGain).coerceAtLeast(0)
        
        // Count milestones / Check badges
        val totalTasksInc = if (isCompleted) 1 else -1
        val newTotalAllTime = (profile.totalTasksCompletedAllTime + totalTasksInc).coerceAtLeast(0)
        val longestStr = maxOf(profile.longestStreak, updated.streak)

        val badgeCount = when {
            newTotalAllTime >= 100 -> 5
            newTotalAllTime >= 50 -> 4
            newTotalAllTime >= 25 -> 3
            newTotalAllTime >= 10 -> 2
            newTotalAllTime >= 5 -> 1
            else -> 0
        }

        userProfileDao.insertOrUpdate(
            profile.copy(
                xp = newXp,
                totalTasksCompletedAllTime = newTotalAllTime,
                longestStreak = longestStr,
                badgeCount = badgeCount
            )
        )
        pushUserProfileToFirestore()

        // Link Task completion to DailyHabits
        val today = getTodayDateString()
        var habits = dailyHabitsDao.getHabitsForDate(today) ?: DailyHabits(dateString = today)
        var changed = false
        val lowerName = task.name.lowercase()
        
        when {
            lowerName.contains("gym") -> {
                if (habits.gymCompleted != isCompleted) {
                    habits = habits.copy(gymCompleted = isCompleted)
                    changed = true
                }
            }
            lowerName.contains("diet") -> {
                if (habits.dietCompleted != isCompleted) {
                    habits = habits.copy(dietCompleted = isCompleted)
                    changed = true
                }
            }
            lowerName.contains("skincare") -> {
                if (habits.skincareCompleted != isCompleted) {
                    habits = habits.copy(skincareCompleted = isCompleted)
                    changed = true
                }
            }
            lowerName.contains("sleep") -> {
                if (habits.sleepCompleted != isCompleted) {
                    habits = habits.copy(sleepCompleted = isCompleted)
                    changed = true
                }
            }
        }
        
        if (changed) {
            dailyHabitsDao.insertOrUpdate(habits)
        }

        // Live notification check (handled reactively or triggered as side effects)
        syncLocalToLeaderboard()
    }

    suspend fun pushUserProfileToFirestore() = withContext(Dispatchers.IO) {
        try {
            val user = FirebaseAuth.getInstance().currentUser
            val profile = userProfileDao.getUserProfile()
            if (user != null && profile != null) {
                val userData = hashMapOf<String, Any?>(
                    "uid" to user.uid,
                    "username" to profile.username,
                    "profilePhoto" to profile.profilePic,
                    "xp" to profile.xp,
                    "streak" to profile.longestStreak,
                    "currentGroupId" to profile.currentGroupId,
                    "currentGroupName" to profile.currentGroupName
                )
                Firebase.firestore.collection("users")
                    .document(user.uid)
                    .set(userData, com.google.firebase.firestore.SetOptions.merge())
                    .await()
            }
        } catch (e: Exception) {
            Log.e("GrindRepository", "Failed pushing user profile to Firestore", e)
        }
    }

    suspend fun syncUserProfileFromFirestoreOnStartup() = withContext(Dispatchers.IO) {
        try {
            val user = FirebaseAuth.getInstance().currentUser
            if (user != null) {
                val doc = Firebase.firestore.collection("users").document(user.uid).get().await()
                if (doc != null && doc.exists()) {
                    val username = doc.getString("username") ?: user.displayName ?: user.email?.substringBefore("@") ?: "Grinder"
                    val profilePic = doc.getString("profilePhoto") ?: user.photoUrl?.toString() ?: "avatar_1"
                    val xp = (doc.getLong("xp") ?: 20).toInt()
                    val streak = (doc.getLong("streak") ?: 0).toInt()
                    val groupId = doc.getString("currentGroupId")
                    val groupName = doc.getString("currentGroupName")

                    val currentProfile = userProfileDao.getUserProfile()
                    val updated = currentProfile?.copy(
                        username = username,
                        profilePic = profilePic,
                        xp = xp,
                        longestStreak = maxOf(currentProfile.longestStreak, streak),
                        currentGroupId = groupId ?: currentProfile.currentGroupId,
                        currentGroupName = groupName ?: currentProfile.currentGroupName
                    ) ?: UserProfile(
                        id = 1,
                        username = username,
                        profilePic = profilePic,
                        xp = xp,
                        longestStreak = streak,
                        currentGroupId = groupId,
                        currentGroupName = groupName,
                        lastResetDateString = getTodayDateString()
                    )
                    userProfileDao.insertOrUpdate(updated)
                }
            }
        } catch (e: Exception) {
            Log.e("GrindRepository", "Failed startup Firestore sync", e)
        }
    }

    suspend fun updateProfileInfo(username: String, avatar: String) = withContext(Dispatchers.IO) {
        val profile = getOrCreateUserProfile()
        val updated = profile.copy(username = username, profilePic = avatar)
        userProfileDao.insertOrUpdate(updated)
        pushUserProfileToFirestore()
        syncLocalToLeaderboard()
    }

    suspend fun syncUserProfileAfterLogin(
        username: String,
        profilePic: String,
        xp: Int,
        streak: Int,
        groupId: String? = null,
        groupName: String? = null
    ) = withContext(Dispatchers.IO) {
        val currentProfile = userProfileDao.getUserProfile()
        val updated = currentProfile?.copy(
            username = username,
            profilePic = profilePic,
            xp = xp,
            longestStreak = maxOf(currentProfile.longestStreak, streak),
            currentGroupId = groupId ?: currentProfile.currentGroupId,
            currentGroupName = groupName ?: currentProfile.currentGroupName
        ) ?: UserProfile(
            id = 1,
            username = username,
            profilePic = profilePic,
            xp = xp,
            longestStreak = streak,
            currentGroupId = groupId,
            currentGroupName = groupName,
            lastResetDateString = getTodayDateString()
        )
        userProfileDao.insertOrUpdate(updated)
        pushUserProfileToFirestore()
        syncLocalToLeaderboard()
    }

    suspend fun logTechStudy(topic: String, platform: String, count: Int) = withContext(Dispatchers.IO) {
        val today = getTodayDateString()
        val xpEarned = 15 // +15 XP for logging a learning session
        val log = TechLog(
            topic = topic,
            platform = platform,
            count = count,
            dateString = today,
            xpEarned = xpEarned
        )
        techLogDao.insertTechLog(log)

        // Award XP to user
        val profile = getOrCreateUserProfile()
        val badgeCheck = when {
            profile.totalTasksCompletedAllTime >= 100 -> 5
            profile.totalTasksCompletedAllTime >= 50 -> 4
            profile.totalTasksCompletedAllTime >= 25 -> 3
            profile.totalTasksCompletedAllTime >= 10 -> 2
            profile.totalTasksCompletedAllTime >= 5 -> 1
            else -> 0
        }
        userProfileDao.insertOrUpdate(
            profile.copy(
                xp = profile.xp + xpEarned,
                badgeCount = badgeCheck
            )
        )
        pushUserProfileToFirestore()

        // Sync local
        syncLocalToLeaderboard()
    }

    suspend fun saveDailyHabits(habits: DailyHabits) = withContext(Dispatchers.IO) {
        dailyHabitsDao.insertOrUpdate(habits)

        // Sync habits back to tasks if it's for today
        if (habits.dateString == getTodayDateString()) {
            val tasks = taskDao.getTasksList()
            val updatedTasks = tasks.map { task ->
                val lowerName = task.name.lowercase()
                when {
                    lowerName.contains("gym") -> task.copy(isCompleted = habits.gymCompleted)
                    lowerName.contains("diet") -> task.copy(isCompleted = habits.dietCompleted)
                    lowerName.contains("skincare") -> task.copy(isCompleted = habits.skincareCompleted)
                    lowerName.contains("sleep") -> task.copy(isCompleted = habits.sleepCompleted)
                    else -> task
                }
            }
            taskDao.insertAll(updatedTasks)
        }

        // Recalculate streak / Award bonus XP
        val profile = getOrCreateUserProfile()
        val isPerfect = habits.gymCompleted && habits.dietCompleted && habits.skincareCompleted && habits.sleepCompleted
        if (isPerfect) {
            userProfileDao.insertOrUpdate(profile.copy(xp = profile.xp + 5))
            pushUserProfileToFirestore()
        }

        // Sync to leaderboard
        syncLocalToLeaderboard()
    }

    // Group / Social sync operations
    fun extractSquadId(input: String): String {
        val trimmed = input.trim()
        val hubRegex = Regex("""(hub-[a-z0-9\-]+)""", RegexOption.IGNORE_CASE)
        val match = hubRegex.find(trimmed)
        if (match != null) {
            return match.value.lowercase().trim()
        }
        return if (trimmed.contains("/")) {
            trimmed.substringAfterLast("/").trim()
        } else {
            trimmed
        }
    }

    suspend fun getGroupNameFromFirestore(groupId: String): String? = withContext(Dispatchers.IO) {
        try {
            val doc = Firebase.firestore.collection("squads").document(groupId).get().await()
            doc.getString("name")
        } catch (e: Exception) {
            null
        }
    }

    suspend fun joinGroup(groupIdInput: String, groupNameInput: String) = withContext(Dispatchers.IO) {
        val cleanGroupId = extractSquadId(groupIdInput)
        
        var finalGroupName = groupNameInput.trim()
        if (finalGroupName.contains("/") || finalGroupName.isBlank() || finalGroupName == cleanGroupId) {
            val remoteName = getGroupNameFromFirestore(cleanGroupId)
            finalGroupName = remoteName ?: "Squad Tribe"
        }
        
        val profile = getOrCreateUserProfile()
        val updated = profile.copy(currentGroupId = cleanGroupId, currentGroupName = finalGroupName)
        userProfileDao.insertOrUpdate(updated)
        pushUserProfileToFirestore()

        // Real sync from Firestore
        syncSquadMembers(cleanGroupId)
    }

    suspend fun leaveGroup() = withContext(Dispatchers.IO) {
        val profile = getOrCreateUserProfile()
        val updated = profile.copy(currentGroupId = null, currentGroupName = null)
        userProfileDao.insertOrUpdate(updated)
        pushUserProfileToFirestore()
        groupMemberDao.deleteAll()
    }

    suspend fun syncLocalToLeaderboard() = withContext(Dispatchers.IO) {
        val profile = userProfileDao.getUserProfile() ?: return@withContext
        val groupId = profile.currentGroupId ?: return@withContext

        // Calculate today's completion percentage
        val tasks = taskDao.getTasksList()
        val total = tasks.size
        val completed = tasks.count { it.isCompleted }
        val pct = if (total > 0) (completed.toFloat() / total * 100f) else 0f

        val user = FirebaseAuth.getInstance().currentUser
        val me = GroupMember(
            userId = user?.uid ?: "",
            username = profile.username,
            dailyCompletionPercentage = pct,
            currentStreak = profile.longestStreak,
            totalTasksAllTime = profile.totalTasksCompletedAllTime,
            xp = profile.xp,
            profilePic = profile.profilePic,
            activeBreakdown = tasks.filter { it.isCompleted }.joinToString(",") { it.name },
            isMe = true
        )
        
        // Save locally
        groupMemberDao.deleteMemberById(me.userId)
        groupMemberDao.insertMembers(listOf(me))

        // Push to Firestore if logged in
        try {
            if (user != null) {
                // 1. Write the squad group name to the squad parent document
                profile.currentGroupName?.let { name ->
                    Firebase.firestore.collection("squads")
                        .document(groupId)
                        .set(mapOf("name" to name), com.google.firebase.firestore.SetOptions.merge())
                        .await()
                }

                // 2. Write the group member document
                Firebase.firestore.collection("squads")
                    .document(groupId)
                    .collection("members")
                    .document(user.uid)
                    .set(me)
                    .await()
            }
        } catch (e: Exception) {
            Log.e("GrindRepository", "Firestore push failed", e)
        }
    }

    suspend fun syncSquadMembers(groupId: String) = withContext(Dispatchers.IO) {
        try {
            // 1. Always start by ensuring we are in the local leaderboard correctly
            syncLocalToLeaderboard()

            val snapshot = try {
                Firebase.firestore.collection("squads")
                    .document(groupId)
                    .collection("members")
                    .get()
                    .await()
            } catch (e: Exception) {
                null
            }

            if (snapshot != null) {
                val currentUser = FirebaseAuth.getInstance().currentUser
                val members = snapshot.documents.mapNotNull { doc ->
                    val member = doc.toObject(GroupMember::class.java)
                    member?.copy(
                        userId = doc.id,
                        isMe = doc.id == currentUser?.uid
                    )
                }

                // If we got real data from Firestore, overwrite local cache
                groupMemberDao.deleteAll()
                groupMemberDao.insertMembers(members)

                // If our own user is NOT in the retrieved list from Firestore (e.g. sync delay),
                // we should still make sure we insert our local 'me'!
                if (currentUser != null && members.none { it.userId == currentUser.uid }) {
                    syncLocalToLeaderboard()
                }
            }
        } catch (e: Exception) {
            Log.e("GrindRepository", "Firestore sync cycle failed", e)
        }
    }

    suspend fun clearAllData() = withContext(Dispatchers.IO) {
        db.clearAllTables()
    }
}
