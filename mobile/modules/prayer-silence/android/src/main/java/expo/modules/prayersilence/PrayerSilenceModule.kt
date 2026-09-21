package expo.modules.prayersilence

import android.app.AlarmManager
import android.app.AppOpsManager
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/** Mirrors PrayerSilence.types.ts's SilenceWindow. Numbers cross the JS
 *  bridge as Double; converted to Long/Int on the way into SilenceStore. */
class SilenceWindowRecord : Record {
  @Field
  var start: Double = 0.0

  @Field
  var durationMinutes: Double = 0.0
}

/**
 * Auto-silence during prayer. Android only — see index.ts for the iOS/web
 * no-op that keeps the JS import safe on every other platform.
 *
 * Every entry point re-checks isNotificationPolicyAccessGranted rather than
 * trusting the JS side's last known value, because the user can revoke that
 * permission in system settings at any time, entirely outside this module.
 */
class PrayerSilenceModule : Module() {
  private companion object {
    /** MIUI's AppOpsManager op code for "Autostart". */
    const val MIUI_OP_AUTO_START = 10008
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context unavailable" }

  private val notificationManager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  override fun definition() = ModuleDefinition {
    Name("PrayerSilence")

    Function("hasPolicyAccess") {
      notificationManager.isNotificationPolicyAccessGranted
    }

    Function("openPolicyAccessSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    // Exact-alarm permission. Lives here rather than in a module of its own
    // because this is already the app's "Android alarm plumbing" module: the
    // silence windows and the adhan (via expo-notifications) both degrade to
    // inexact alarms without it. From Android 14 the permission is denied by
    // default and only the user can grant it, on a system screen.
    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        true
      } else {
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).canScheduleExactAlarms()
      }
    }

    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val intent = Intent(
          Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
          Uri.parse("package:${context.packageName}")
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    // Xiaomi's own "Autostart" switch (MIUI / HyperOS), off by default for
    // apps from the Play Store. With it off, once the system kills the app's
    // process an alarm cannot bring it back, and the adhan waits until
    // something else does: on 2026-09-21 Maghrib came 2.5 hours late,
    // together with Isha. Android has no public API for it; the state is the
    // hidden app-op 10008, read by reflection, which is what every "please
    // allow autostart" prompt on these phones does.
    Function("autostartState") {
      autostartState()
    }

    Function("openAutostartSettings") {
      openAutostartSettings()
    }

    Function("scheduleSilence") { windows: List<SilenceWindowRecord> ->
      scheduleSilence(windows.map { SilenceStore.Window(it.start.toLong(), it.durationMinutes.toInt()) })
    }

    Function("cancelSilence") {
      cancelSilence()
    }
  }

  /** "allowed", "denied", or "unknown" (not a Xiaomi phone, or the hidden
   *  op could not be read on this build). Only "denied" should prompt. */
  private fun autostartState(): String {
    if (!Build.MANUFACTURER.equals("xiaomi", ignoreCase = true)) return "unknown"
    return try {
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val check = AppOpsManager::class.java.getMethod(
        "checkOpNoThrow",
        Int::class.javaPrimitiveType,
        Int::class.javaPrimitiveType,
        String::class.java,
      )
      val mode = check.invoke(appOps, MIUI_OP_AUTO_START, context.applicationInfo.uid, context.packageName) as Int
      if (mode == AppOpsManager.MODE_ALLOWED) "allowed" else "denied"
    } catch (e: Exception) {
      "unknown"
    }
  }

  /** The Security app's Autostart list, or this app's system settings page
   *  when that screen is missing or moved on this build. */
  private fun openAutostartSettings() {
    val autostart = Intent().setComponent(
      ComponentName(
        "com.miui.securitycenter",
        "com.miui.permcenter.autostart.AutoStartManagementActivity",
      ),
    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(autostart)
    } catch (e: Exception) {
      val details = Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.parse("package:${context.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(details)
    }
  }

  private fun scheduleSilence(windows: List<SilenceStore.Window>) {
    SilenceScheduler.cancelAll(context, SilenceStore.loadWindows(context))

    if (!notificationManager.isNotificationPolicyAccessGranted) {
      // Nothing is armed without access. The settings screen re-checks on
      // every foreground and calls this again once access is granted.
      SilenceStore.clearWindows(context)
      return
    }

    val now = System.currentTimeMillis()
    val upcoming = windows.filter { it.end > now }
    SilenceStore.saveWindows(context, upcoming)
    upcoming.forEachIndexed { index, window ->
      SilenceScheduler.arm(context, index, window, now)
    }
  }

  private fun cancelSilence() {
    SilenceScheduler.cancelAll(context, SilenceStore.loadWindows(context))
    SilenceStore.clearWindows(context)
    // If a window was mid-silence when this ran, restore what it overrode
    // rather than leaving Do Not Disturb stuck on until some future alarm
    // that was just cancelled.
    SilenceStore.takePrevFilter(context)?.let {
      if (notificationManager.isNotificationPolicyAccessGranted) {
        notificationManager.setInterruptionFilter(it)
      }
    }
  }
}
