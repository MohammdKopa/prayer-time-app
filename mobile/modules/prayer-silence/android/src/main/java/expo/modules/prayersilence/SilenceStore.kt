package expo.modules.prayersilence

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Everything this module needs to survive a process death or a reboot lives
 * here: the window list (so BootReceiver can re-arm what AlarmManager
 * forgot) and the interruption filter the module overrode (so ending a
 * window restores exactly what the user had, not a guessed default).
 *
 * org.json is used deliberately — it ships with Android, so this module
 * carries no extra dependency for something this small.
 */
internal object SilenceStore {
  private const val PREFS_NAME = "prayer_silence"
  private const val KEY_WINDOWS = "windows"
  private const val KEY_PREV_FILTER = "prev_filter"
  private const val KEY_PREV_FILTER_VALID = "prev_filter_valid"

  data class Window(val start: Long, val durationMinutes: Int) {
    val end: Long get() = start + durationMinutes * 60_000L
  }

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun saveWindows(context: Context, windows: List<Window>) {
    val arr = JSONArray()
    for (w in windows) {
      val obj = JSONObject()
      obj.put("start", w.start)
      obj.put("durationMinutes", w.durationMinutes)
      arr.put(obj)
    }
    prefs(context).edit().putString(KEY_WINDOWS, arr.toString()).apply()
  }

  fun loadWindows(context: Context): List<Window> {
    val raw = prefs(context).getString(KEY_WINDOWS, null) ?: return emptyList()
    return try {
      val arr = JSONArray(raw)
      (0 until arr.length()).map { i ->
        val obj = arr.getJSONObject(i)
        Window(obj.getLong("start"), obj.getInt("durationMinutes"))
      }
    } catch (e: Exception) {
      // Corrupted or foreign JSON in our own prefs key. Nothing to arm is
      // safer than crashing the boot receiver over it.
      emptyList()
    }
  }

  fun clearWindows(context: Context) {
    prefs(context).edit().remove(KEY_WINDOWS).apply()
  }

  fun savePrevFilter(context: Context, filter: Int) {
    prefs(context).edit()
      .putInt(KEY_PREV_FILTER, filter)
      .putBoolean(KEY_PREV_FILTER_VALID, true)
      .apply()
  }

  /** Reads the saved filter without clearing it — used by the "start" alarm
   *  to tell whether a filter is already saved, so a second prayer starting
   *  before the first one's "end" alarm fires never overwrites the ORIGINAL
   *  filter with the silenced one. */
  fun peekPrevFilter(context: Context): Int? {
    val p = prefs(context)
    if (!p.getBoolean(KEY_PREV_FILTER_VALID, false)) return null
    val value = p.getInt(KEY_PREV_FILTER, -1)
    return if (value == -1) null else value
  }

  /** Reads and clears the saved filter — used by "end" and by cancelSilence
   *  to restore it exactly once. */
  fun takePrevFilter(context: Context): Int? {
    val value = peekPrevFilter(context)
    if (value != null) {
      prefs(context).edit().putBoolean(KEY_PREV_FILTER_VALID, false).apply()
    }
    return value
  }
}
