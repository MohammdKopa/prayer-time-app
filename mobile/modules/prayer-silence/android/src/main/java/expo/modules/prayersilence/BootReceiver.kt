package expo.modules.prayersilence

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-arms the schedule after a restart. AlarmManager alarms do not survive a
 * reboot; the window list saved in SharedPreferences is the only thing that
 * does.
 *
 * Windows already over are dropped, and so — deliberately — is a window that
 * was mid-silence at the moment of reboot: there is no way to know what
 * interruption filter it overrode without guessing, and a wrong guess can
 * leave Do Not Disturb stuck on. Missing one partial silence window across a
 * reboot is the safer failure.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

    val now = System.currentTimeMillis()
    val windows = SilenceStore.loadWindows(context).filter { it.start > now && it.end > now }
    SilenceStore.saveWindows(context, windows)
    windows.forEachIndexed { index, window ->
      SilenceScheduler.arm(context, index, window, now)
    }
  }
}
