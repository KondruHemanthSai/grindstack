package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.foundation.border
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.data.AppDatabase
import com.example.data.GrindRepository
import com.example.ui.GrindViewModel
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.google.firebase.Firebase
import com.google.firebase.firestore.firestore
import com.google.firebase.auth.FirebaseAuth
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize persistent database on startup
        val database = AppDatabase.getDatabase(applicationContext)
        val repository = GrindRepository(database)
        val viewModel = GrindViewModel(repository)

        setContent {
            MyApplicationTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val isLoggedIn = remember { FirebaseAuth.getInstance().currentUser != null }
                val startDest = if (isLoggedIn) "dashboard" else "login"
                val currentRoute = navBackStackEntry?.destination?.route ?: startDest

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = SpaceBlack,
                    topBar = {
                        if (currentRoute != "login") {
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .statusBarsPadding(),
                                color = Color(0xCC111008) // rgba(17, 16, 8, 0.8)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 20.dp, vertical = 16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "GRINDSTACK",
                                        style = TextStyle(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 20.sp,
                                            letterSpacing = (-0.5).sp,
                                            color = TextPrimary
                                        )
                                    )
                                    Box(
                                        modifier = Modifier
                                            .background(AccentOrange.copy(alpha = 0.1f), RoundedCornerShape(20.dp))
                                            .border(1.dp, AccentOrange.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                                            .padding(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = when(currentRoute) {
                                                "dashboard" -> "DASHBOARD"
                                                "tech" -> "ACADEMY"
                                                "health" -> "WELLBEING"
                                                "social" -> "SQUAD TRIBE"
                                                "profile" -> "PROFILE"
                                                else -> "GRINDSTACK"
                                            },
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                color = AccentOrange,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    },
                    bottomBar = {
                        if (currentRoute != "login") {
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .navigationBarsPadding(),
                                color = Color(0xD9111008) // Translucent SpaceBlack (rgba(17, 16, 8, 0.85))
                            ) {
                                Column(modifier = Modifier.fillMaxWidth()) {
                                    HorizontalDivider(
                                        thickness = 1.dp,
                                        color = CardBorder
                                    )
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(64.dp),
                                        horizontalArrangement = Arrangement.SpaceAround,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        val items = listOf(
                                            NavigationTab("dashboard", "Dashboard", Icons.Default.Dashboard, "nav_dashboard_tab"),
                                            NavigationTab("tech", "Academy", Icons.Default.AutoStories, "nav_tech_tab"),
                                            NavigationTab("health", "Wellbeing", Icons.Default.Favorite, "nav_health_tab"),
                                            NavigationTab("social", "Squad", Icons.Default.Groups, "nav_social_tab"),
                                            NavigationTab("profile", "Profile", Icons.Default.Person, "nav_profile_tab")
                                        )

                                        items.forEach { tab ->
                                            val selected = currentRoute == tab.route
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .fillMaxHeight()
                                                    .clickable(
                                                        interactionSource = remember { MutableInteractionSource() },
                                                        indication = null
                                                    ) {
                                                        if (currentRoute != tab.route) {
                                                            navController.navigate(tab.route) {
                                                                popUpTo("dashboard") { saveState = true }
                                                                launchSingleTop = true
                                                                restoreState = true
                                                            }
                                                        }
                                                    }
                                                    .testTag(tab.testTag),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Column(
                                                    horizontalAlignment = Alignment.CenterHorizontally,
                                                    verticalArrangement = Arrangement.Center
                                                ) {
                                                    Icon(
                                                        imageVector = tab.icon,
                                                        contentDescription = tab.label,
                                                        tint = if (selected) AccentOrange else TextSecondary,
                                                        modifier = Modifier.size(20.dp)
                                                    )
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Text(
                                                        text = tab.label,
                                                        style = MaterialTheme.typography.labelSmall.copy(
                                                            fontSize = 10.sp,
                                                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                                            color = if (selected) AccentOrange else TextSecondary
                                                        )
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = startDest,
                        enterTransition = { fadeIn(animationSpec = tween(150)) },
                        exitTransition = { fadeOut(animationSpec = tween(150)) },
                        popEnterTransition = { fadeIn(animationSpec = tween(150)) },
                        popExitTransition = { fadeOut(animationSpec = tween(150)) },
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        composable("login") {
                            LoginScreen(
                                viewModel = viewModel,
                                onLoginSuccess = {
                                    navController.navigate("dashboard") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("dashboard") {
                            DashboardScreen(viewModel = viewModel)
                        }
                        composable("tech") {
                            TechScreen(viewModel = viewModel)
                        }
                        composable("health") {
                            HealthScreen(viewModel = viewModel)
                        }
                        composable("social") {
                            SocialScreen(viewModel = viewModel)
                        }
                        composable("profile") {
                            ProfileScreen(
                                viewModel = viewModel,
                                onLogout = {
                                    FirebaseAuth.getInstance().signOut()
                                    val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                                        .requestEmail()
                                        .build()
                                    val googleSignInClient = GoogleSignIn.getClient(this@MainActivity, gso)
                                    googleSignInClient.signOut().addOnCompleteListener {
                                        viewModel.logout {
                                            navController.navigate("login") {
                                                popUpTo(0) { inclusive = true }
                                            }
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

data class NavigationTab(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val testTag: String = ""
)
