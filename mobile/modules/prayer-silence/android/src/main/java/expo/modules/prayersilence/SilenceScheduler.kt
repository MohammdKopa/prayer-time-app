package expo.modules.prayersilence

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Owns the AlarmManager side of a silence window: arming the start/end pair
 * and cancelling a previous set. Shared by the module (JS calls in) and
 * BootReceiver (the OS calls in after a restart) so the two never drift into
 * scheduling alarms two different ways.
 *
 * Request-code scheme: index*2 is a window's start, index*2+1 its end. Seven
 * days x five prayers is at most 35 windows, 70 request codes — nowhere near
 * colliding.
 */
internal object SilenceScheduler {
  private const val ACTION_PREFIX = "app.kametrix.prayer.SILENCE_"

  private fun requestCode(index: Int, isStart: Boolean): Int =
    index * 2 + if (isStart) 0 else 1

  private fun alarmManager(context: Context): AlarmManager =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun pendingIntent(context: Context, requestCode: Int, isStart: Boolean): PendingIntent {
    val intent = Intent(context, SilenceAlarmReceiver::class.java).apply {
      action = ACTION_PREFIX + requestCode
      putExtra(SilenceAlarmReceiver.EXTRA_IS_START, isStart)
    }
    return PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun schedule(context: Context, requestCode: Int, atMillis: Long, isStart: Boolean) {
    val pending = pendingIntent(context, requestCode, isStart)
    val am = alarmManager(context)
    // The app already declares SCHEDULE_EXACT_ALARM; below API 31 there is
    // nothing to check, and canScheduleExactAlarms() only exists from 31.
    val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
    if (canExact) {
      am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
    } else {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
    }
  }

  /** Cancels every alarm for a previously-saved window list. Always called
   *  before arming a new list, so a reschedule never stacks on top of the
   *  last one. */
  fun cancelAll(context: Context, previous: List<SilenceStore.Window>) {
    val am = alarmManager(context)
    previous.indices.forEach { index ->
      am.cancel(pendingIntent(context, requestCode(index, true), true))
      am.cancel(pendingIntent(context, requestCode(index, false), false))
    }
  }

  /**
   * Arms one window's start/end pair. A start already in the past — a
   * reboot mid-window, or a slow app launch right as a prayer begins —
   * fires almost immediately instead of never, so the matching "end" alarm
   * is never left with no "start" to pair against.
   */
  fun arm(context: Context, index: Int, window: SilenceStore.Window, now: Long) {
    val startAt = if (window.start > now) window.start else now + 1_000L
    schedule(context, requestCode(index, true), startAt, true)
    schedule(context, requestCode(index, false), window.end, false)
  }
}
