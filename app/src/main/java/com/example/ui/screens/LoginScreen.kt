package com.example.ui.screens

import android.app.Activity
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.GrindViewModel
import com.example.ui.theme.*
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.firestore
import com.google.firebase.Firebase

@Composable
fun LoginScreen(
    viewModel: GrindViewModel,
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Google Sign In configuration
    val gso = remember {
        val webClientId = try {
            context.getString(context.resources.getIdentifier("default_web_client_id", "string", context.packageName))
        } catch (e: Exception) {
            "118291616225-7gmok962l08h7fcuoifdb5q54013anf7.apps.googleusercontent.com"
        }
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
    }

    val googleSignInClient = remember {
        GoogleSignIn.getClient(context, gso)
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)!!
                account.idToken?.let { idToken ->
                    isLoading = true
                    val credential = GoogleAuthProvider.getCredential(idToken, null)
                    FirebaseAuth.getInstance().signInWithCredential(credential)
                        .addOnCompleteListener { authTask ->
                            if (authTask.isSuccessful) {
                                val user = FirebaseAuth.getInstance().currentUser
                                if (user != null) {
                                    val db = Firebase.firestore
                                    val userRef = db.collection("users").document(user.uid)
                                    userRef.get().addOnSuccessListener { document ->
                                        var existingXp = 0
                                        var existingStreak = 0
                                        var existingGroupId: String? = null
                                        var existingGroupName: String? = null
                                        if (document != null && document.exists()) {
                                            existingXp = (document.getLong("xp") ?: 0).toInt()
                                            existingStreak = (document.getLong("streak") ?: 0).toInt()
                                            existingGroupId = document.getString("currentGroupId")
                                            existingGroupName = document.getString("currentGroupName")
                                        }

                                        val email = user.email ?: ""
                                        val username = user.displayName ?: email.substringBefore("@")
                                        val photoUrl = user.photoUrl?.toString() ?: ""

                                        val userData = hashMapOf<String, Any?>(
                                            "uid" to user.uid,
                                            "username" to username,
                                            "email" to email,
                                            "profilePhoto" to photoUrl,
                                            "xp" to existingXp,
                                            "streak" to existingStreak
                                        )

                                        if (existingGroupId != null) {
                                            userData["currentGroupId"] = existingGroupId
                                            userData["currentGroupName"] = existingGroupName
                                        }

                                        if (!document.exists()) {
                                            userData["createdAt"] = FieldValue.serverTimestamp()
                                        }

                                        userRef.set(userData, SetOptions.merge())
                                            .addOnSuccessListener {
                                                viewModel.syncUserProfile(
                                                    username = username,
                                                    profilePic = photoUrl,
                                                    xp = existingXp,
                                                    streak = existingStreak,
                                                    groupId = existingGroupId,
                                                    groupName = existingGroupName
                                                )
                                                isLoading = false
                                                onLoginSuccess()
                                            }
                                            .addOnFailureListener { e ->
                                                isLoading = false
                                                errorMessage = "Firestore Sync Failed: ${e.message}"
                                                Log.e("LOGIN_SCREEN", "Firestore Sync Error", e)
                                            }
                                    }.addOnFailureListener { e ->
                                        isLoading = false
                                        errorMessage = "Failed to query existing user metrics: ${e.message}"
                                        Log.e("LOGIN_SCREEN", "Firestore Fetch Error", e)
                                    }
                                } else {
                                    isLoading = false
                                    errorMessage = "Firebase User is null"
                                }
                            } else {
                                isLoading = false
                                errorMessage = "Firebase Auth Failed: ${authTask.exception?.message}"
                                Log.e("LOGIN_SCREEN", "Firebase Auth Error", authTask.exception)
                            }
                        }
                } ?: run {
                    errorMessage = "Google Sign In token is null"
                }
            } catch (e: ApiException) {
                errorMessage = "Google Sign In Failed: Code ${e.statusCode} (${e.message})"
                Log.e("LOGIN_SCREEN", "Google Sign In ApiException", e)
            }
        } else {
            errorMessage = "Google Sign In Cancelled"
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .padding(horizontal = 24.dp, vertical = 40.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            // Header Section
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .glassCard(shape = RoundedCornerShape(16.dp))
                        .background(Color(0x0AFFFFFF)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "⚡",
                        fontSize = 32.sp,
                        color = WarmAccentWhite
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "GRINDSTACK",
                    style = MaterialTheme.typography.headlineLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = WarmAccentWhite,
                        letterSpacing = 4.sp
                    )
                )
                Text(
                    text = "Reclaim your focus. Track, study, recover, and grow.",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = MutedWarmWhite
                    ),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Features List
            Column(
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                // Feature 1
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard(shape = RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(text = "🎯", fontSize = 24.sp)
                        Column {
                            Text(
                                text = "Daily Checklists & Heatmaps",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = WarmAccentWhite
                                )
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Track your tasks and watch your streak grow. Consistency is key.",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = MutedWarmWhite
                                )
                            )
                        }
                    }
                }

                // Feature 2
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard(shape = RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(text = "📚", fontSize = 24.sp)
                        Column {
                            Text(
                                text = "Academy Study Mode",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = WarmAccentWhite
                                )
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Log your study hours, trace topics, and earn skill XP points.",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = MutedWarmWhite
                                )
                            )
                        }
                    }
                }

                // Feature 3
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard(shape = RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(text = "🛡️", fontSize = 24.sp)
                        Column {
                            Text(
                                text = "Squad Tribes",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = WarmAccentWhite
                                )
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Join squads with clean invite codes and compete on the live leaderboard.",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = MutedWarmWhite
                                )
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (isLoading) {
                CircularProgressIndicator(
                    color = WarmAccentWhite,
                    modifier = Modifier.size(40.dp)
                )
            } else {
                GrindButton(
                    text = "Continue with Google",
                    onClick = {
                        errorMessage = null
                        val signInIntent = googleSignInClient.signInIntent
                        launcher.launch(signInIntent)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                )
            }

            errorMessage?.let { msg ->
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = msg,
                    color = Color.Red,
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }
    }
}

