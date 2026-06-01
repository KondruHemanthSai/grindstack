package com.example.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface UserProfileDao {
    @Query("SELECT * FROM user_profile WHERE id = 1 LIMIT 1")
    fun getUserProfileFlow(): Flow<UserProfile?>

    @Query("SELECT * FROM user_profile WHERE id = 1 LIMIT 1")
    suspend fun getUserProfile(): UserProfile?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(profile: UserProfile)
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY id ASC")
    fun getAllTasks(): Flow<List<Task>>

    @Query("SELECT * FROM tasks ORDER BY id ASC")
    suspend fun getTasksList(): List<Task>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: Task)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<Task>)

    @Update
    suspend fun updateTask(task: Task)

    @Delete
    suspend fun deleteTask(task: Task)

    @Query("DELETE FROM tasks WHERE isCustom = 1 AND id = :id")
    suspend fun deleteCustomTaskById(id: Int)
}

@Dao
interface TechLogDao {
    @Query("SELECT * FROM tech_logs ORDER BY id DESC")
    fun getTechLogsFlow(): Flow<List<TechLog>>

    @Query("SELECT * FROM tech_logs WHERE topic = :topic ORDER BY id DESC")
    fun getLogsForTopicFlow(topic: String): Flow<List<TechLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTechLog(log: TechLog)

    @Delete
    suspend fun deleteTechLog(log: TechLog)
}

@Dao
interface DailyHabitsDao {
    @Query("SELECT * FROM daily_habits WHERE dateString = :dateString LIMIT 1")
    fun getHabitsForDateFlow(dateString: String): Flow<DailyHabits?>

    @Query("SELECT * FROM daily_habits WHERE dateString = :dateString LIMIT 1")
    suspend fun getHabitsForDate(dateString: String): DailyHabits?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(habits: DailyHabits)

    @Query("SELECT * FROM daily_habits ORDER BY dateString DESC")
    fun getAllHabitsFlow(): Flow<List<DailyHabits>>

    @Query("SELECT * FROM daily_habits ORDER BY dateString DESC")
    suspend fun getAllHabits(): List<DailyHabits>

    @Query("DELETE FROM daily_habits")
    suspend fun clearAll()
}

@Dao
interface GroupMemberDao {
    @Query("SELECT * FROM group_members ORDER BY (dailyCompletionPercentage + currentStreak * 2 + xp * 0.1) DESC")
    fun getLeaderboardFlow(): Flow<List<GroupMember>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMembers(members: List<GroupMember>)

    @Query("DELETE FROM group_members")
    suspend fun deleteAll()

    @Query("DELETE FROM group_members WHERE userId = :userId")
    suspend fun deleteMemberById(userId: String)
}
