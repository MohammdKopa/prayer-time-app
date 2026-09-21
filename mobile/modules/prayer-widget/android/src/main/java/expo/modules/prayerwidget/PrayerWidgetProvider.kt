package expo.modules.prayerwidget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import java.util.Calendar
import java.util.Locale
import org.json.JSONObject

/**
 * The home-screen widget: next prayer name, time, and a live countdown.
 *
 * There is no server and no push here — the schedule is whatever JS last
 * wrote via PrayerWidgetModule.setSchedule (see mobile/src/lib/widget.ts),
 * and this class only ever reads it back. Live-ness comes from an
 * AlarmManager alarm this class re-arms for the next minute boundary every
 * time it fires, on boot, and whenever a widget instance is (re-)enabled —
 * updatePeriodMillis in widget_prayer_info.xml is 0 because the system's own
 * floor for that (30 minutes) is useless for a countdown.
 */
class PrayerWidgetProvider : AppWidgetProvider() {

  companion object {
    private const val ACTION_TICK = "expo.modules.prayerwidget.ACTION_TICK"
    private const val ALARM_REQUEST_CODE = 4210

    private val ARABIC_INDIC_DIGITS =
      charArrayOf('٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩')

    /** JS already renders every label in the user's language; the one thing
     *  Kotlin still has to localise itself is digits, because they are
     *  generated here from a raw epoch millisecond, not translated text. */
    private fun toArabicIndic(s: String): String {
      val out = StringBuilder(s.length)
      for (ch in s) {
        out.append(if (ch in '0'..'9') ARABIC_INDIC_DIGITS[ch - '0'] else ch)
      }
      return out.toString()
    }

    private fun widgetIds(context: Context): IntArray {
      val manager = AppWidgetManager.getInstance(context)
      return manager.getAppWidgetIds(
        ComponentName(context, PrayerWidgetProvider::class.java),
      )
    }

    /** Called from the Expo module right after a fresh schedule is written,
     *  and from every alarm tick. Re-renders every placed widget instance and
     *  re-arms the next tick.
     *
     *  With zero widgets placed it cancels the tick instead of arming it.
     *  It used to arm unconditionally, and since JS calls this on every
     *  adhan reschedule, a phone with no widget at all ticked every minute
     *  (seen on the Redmi, 2026-09-21: 71 ticks, no instance placed). */
    fun refreshAll(context: Context) {
      val ids = widgetIds(context)
      if (ids.isEmpty()) {
        cancelTick(context)
        return
      }
      val manager = AppWidgetManager.getInstance(context)
      for (id in ids) {
        manager.updateAppWidget(id, buildViews(context))
      }
      scheduleNextTick(context)
    }

    private fun tickPendingIntent(context: Context): PendingIntent {
      val intent = Intent(context, PrayerWidgetProvider::class.java).setAction(ACTION_TICK)
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      return PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags)
    }

    private fun scheduleNextTick(context: Context) {
      val alarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
      val now = System.currentTimeMillis()
      val nextMinute = (now / 60_000L + 1L) * 60_000L
      val pendingIntent = tickPendingIntent(context)

      // RTC, not RTC_WAKEUP, and never "allow while idle": the countdown only
      // matters while someone is looking at the screen, and a non-wakeup
      // alarm that comes due while the screen is off is delivered the moment
      // the device wakes, which is exactly when the widget is next seen.
      // The wakeup version woke the phone 1,440 times a day and spent the
      // app's allow-while-idle budget, which the adhan alarms share.
      //
      // SCHEDULE_EXACT_ALARM is granted at install on API < 31; from 31 it is
      // a user-revocable permission, so this checks rather than assumes.
      val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
        alarmManager.canScheduleExactAlarms()
      try {
        if (canExact) {
          alarmManager.setExact(AlarmManager.RTC, nextMinute, pendingIntent)
        } else {
          alarmManager.set(AlarmManager.RTC, nextMinute, pendingIntent)
        }
      } catch (e: SecurityException) {
        // The permission could be revoked between the check above and the
        // call itself. A late-by-a-few-minutes widget beats a crashed host.
        alarmManager.set(AlarmManager.RTC, nextMinute, pendingIntent)
      }
    }

    private fun cancelTick(context: Context) {
      val alarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
      alarmManager.cancel(tickPendingIntent(context))
    }

    /**
     * Pure render: reads whatever schedule JS last wrote and lays out one
     * widget instance. Never throws — a missing, empty, or malformed
     * schedule (an old build, a half-finished write) renders the empty state
     * rather than taking the widget host down.
     */
    private fun buildViews(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.widget_prayer)

      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (launchIntent != null) {
        val pendingIntent = PendingIntent.getActivity(
          context,
          0,
          launchIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
      }

      val appName = context.applicationInfo.loadLabel(context.packageManager).toString()
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val raw = prefs.getString(PREFS_KEY_SCHEDULE, null)

      if (raw == null) {
        showEmpty(views, appName, "")
        return views
      }

      try {
        renderSchedule(views, raw, appName)
      } catch (e: Exception) {
        // Untrusted JSON from a previous, possibly incompatible build — fail
        // to the empty state, never to a half-drawn widget.
        showEmpty(views, appName, "")
      }
      return views
    }

    private fun renderSchedule(views: RemoteViews, raw: String, appName: String) {
      val root = JSONObject(raw)
      val isArabic = root.optString("locale", "en") == "ar"
      val names = root.optJSONObject("names")
      val prayers = root.optJSONArray("prayers")
      val now = System.currentTimeMillis()

      var nextKey: String? = null
      var nextAt = -1L

      if (prayers != null) {
        for (i in 0 until prayers.length()) {
          val entry = prayers.optJSONObject(i) ?: continue
          val at = entry.optLong("at", -1L)
          val key = entry.optString("key", "")
          if (at <= now || key.isEmpty()) continue
          if (nextAt == -1L || at < nextAt) {
            nextAt = at
            nextKey = key
          }
        }
      }

      val key = nextKey
      if (key == null || nextAt <= 0L) {
        showEmpty(views, appName, root.optString("labelEmpty", ""))
        return
      }

      val name = names?.optString(key, key) ?: key

      val calendar = Calendar.getInstance()
      calendar.timeInMillis = nextAt
      var timeText = String.format(
        Locale.US,
        "%02d:%02d",
        calendar.get(Calendar.HOUR_OF_DAY),
        calendar.get(Calendar.MINUTE),
      )

      val totalMinutes = ((nextAt - now) / 60_000L).coerceAtLeast(0L)
      val hours = totalMinutes / 60L
      val minutes = totalMinutes % 60L
      val labelIn = root.optString("labelIn", "")
      var countdownText = if (hours > 0) {
        "$labelIn ${hours}h ${minutes}m"
      } else {
        "$labelIn ${minutes}m"
      }

      if (isArabic) {
        timeText = toArabicIndic(timeText)
        countdownText = toArabicIndic(countdownText)
      }

      views.setViewVisibility(R.id.widget_content, View.VISIBLE)
      views.setViewVisibility(R.id.widget_empty, View.GONE)
      views.setTextViewText(R.id.widget_label, root.optString("labelNext", ""))
      views.setTextViewText(R.id.widget_prayer_name, name)
      views.setTextViewText(R.id.widget_time, timeText)
      views.setTextViewText(R.id.widget_countdown, countdownText)
    }

    private fun showEmpty(views: RemoteViews, appName: String, hint: String) {
      views.setViewVisibility(R.id.widget_content, View.GONE)
      views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
      views.setTextViewText(R.id.widget_app_name, appName)
      views.setTextViewText(R.id.widget_empty_hint, hint)
    }
  }

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (id in appWidgetIds) {
      appWidgetManager.updateAppWidget(id, buildViews(context))
    }
    scheduleNextTick(context)
  }

  override fun onEnabled(context: Context) {
    scheduleNextTick(context)
  }

  override fun onDisabled(context: Context) {
    cancelTick(context)
  }

  override fun onReceive(context: Context, intent: Intent) {
    // Dispatches the standard APPWIDGET_UPDATE/ENABLED/DISABLED/DELETED
    // actions to onUpdate/onEnabled/onDisabled above. BOOT_COMPLETED and our
    // own tick are not part of that standard set, so they are handled here.
    super.onReceive(context, intent)
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED, ACTION_TICK -> refreshAll(context)
    }
  }
}
