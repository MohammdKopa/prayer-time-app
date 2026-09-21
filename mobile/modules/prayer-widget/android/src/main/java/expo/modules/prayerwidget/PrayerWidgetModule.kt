package expo.modules.prayerwidget

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** SharedPreferences file the widget's schedule is written to, and read back
 *  from PrayerWidgetProvider. Shared as constants so the two files can never
 *  drift onto different keys. */
const val PREFS_NAME = "prayer_widget"
const val PREFS_KEY_SCHEDULE = "schedule"

/**
 * JS bridge for the home-screen widget.
 *
 * `setSchedule` is called at the end of every notification reschedule (see
 * mobile/src/lib/widget.ts, wired from reschedule() in
 * mobile/src/lib/notifications.ts): it persists the next 7 days of adjusted
 * prayer times as one JSON blob and repaints every placed widget instance
 * immediately, so the widget never waits on its own alarm to pick up a new
 * schedule after a location or language change.
 */
class PrayerWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrayerWidget")

    Function("setSchedule") { json: String ->
      appContext.reactContext?.let { context ->
        context
          .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
          .edit()
          .putString(PREFS_KEY_SCHEDULE, json)
          .apply()
        PrayerWidgetProvider.refreshAll(context)
      }
    }

    Function("refresh") {
      appContext.reactContext?.let { context ->
        PrayerWidgetProvider.refreshAll(context)
      }
    }
  }
}
