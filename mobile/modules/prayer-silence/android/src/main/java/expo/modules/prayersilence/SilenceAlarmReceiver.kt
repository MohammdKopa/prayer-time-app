package expo.modules.prayersilence

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Fires at the start and end of every silence window. Only ever touches
 * INTERRUPTION_FILTER, and only when policy-access is currently granted — a
 * user can revoke that permission after scheduling, and NotificationManager
 * silently no-ops setInterruptionFilter without it, so checking first is
 * what keeps this from looking like it worked when it did not.
 */
class SilenceAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val isStart = intent.getBooleanExtra(EXTRA_IS_START, true)
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (!nm.isNotificationPolicyAccessGranted) return

    if (isStart) {
      // Do not overwrite a filter that is already saved and waiting to be
      // restored. Two prayers close enough together that a second "start"
      // lands before the first "end" must not save the SILENCED filter as
      // if it were the original one underneath it.
      if (SilenceStore.peekPrevFilter(context) == null) {
        SilenceStore.savePrevFilter(context, nm.currentInterruptionFilter)
      }
      nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
    } else {
      SilenceStore.takePrevFilter(context)?.let { nm.setInterruptionFilter(it) }
    }
  }

  companion object {
    const val EXTRA_IS_START = "isStart"
  }
}
