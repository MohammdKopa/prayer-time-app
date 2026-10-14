package expo.modules.prayercompass

import android.content.Context
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.Surface
import android.view.WindowManager
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.abs

/**
 * A compass heading from Android's ROTATION VECTOR sensor.
 *
 * Why not expo-location's watchHeadingAsync: on Android it combines the raw
 * magnetometer and accelerometer itself (getRotationMatrix) at
 * SENSOR_DELAY_NORMAL, about 5 Hz, and only reports once the angle has moved
 * about 2 degrees. The needle can only jump, every tremor of the hand comes
 * through the accelerometer, and no smoothing in JS can make that fluid.
 *
 * The rotation vector is the OS's own fusion of gyroscope, accelerometer and
 * magnetometer: filtered, fast and steady on every phone with a gyroscope.
 * Without one, the geomagnetic rotation vector (still OS-filtered) is used;
 * with neither, isAvailable() is false and the screen falls back to
 * expo-location. iOS never gets here: Core Location's heading is already fused.
 *
 * Events: "onHeading" { trueHeading: 0..360, accuracy: 0..3 } at up to ~30 Hz,
 * only while the app is in the foreground.
 */
class PrayerCompassModule : Module(), SensorEventListener {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private val sensorManager: SensorManager?
    get() = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  private var running = false
  private var listening = false
  private var declination = 0f
  private var accuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM
  private var lastSent = 0L
  private var lastHeading = -1f
  /** Held upright, the heading follows the back of the phone instead of its
   *  top edge; with a little hysteresis so it does not flicker at the edge. */
  private var upright = false

  private val rotation = FloatArray(9)
  private val remapped = FloatArray(9)
  private val orientation = FloatArray(3)

  private fun sensor(): Sensor? {
    val sm = sensorManager ?: return null
    return sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
      ?: sm.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR)
  }

  override fun definition() = ModuleDefinition {
    Name("PrayerCompass")

    Events("onHeading")

    Function("isAvailable") { sensor() != null }

    Function("start") { latitude: Double, longitude: Double ->
      declination = GeomagneticField(
        latitude.toFloat(),
        longitude.toFloat(),
        0f,
        System.currentTimeMillis(),
      ).declination
      running = true
      listen()
    }

    Function("stop") {
      running = false
      unlisten()
    }

    OnActivityEntersForeground { if (running) listen() }
    OnActivityEntersBackground { unlisten() }
    OnDestroy {
      running = false
      unlisten()
    }
  }

  private fun listen() {
    if (listening) return
    val s = sensor() ?: return
    // GAME is ~50 Hz: enough for a fluid needle; events are thinned below.
    listening = sensorManager?.registerListener(this, s, SensorManager.SENSOR_DELAY_GAME) == true
    lastHeading = -1f
  }

  private fun unlisten() {
    if (!listening) return
    sensorManager?.unregisterListener(this)
    listening = false
  }

  @Suppress("DEPRECATION")
  private fun displayRotation(): Int {
    val activity = appContext.currentActivity
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      activity?.display?.rotation ?: Surface.ROTATION_0
    } else {
      (context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager)
        ?.defaultDisplay?.rotation ?: Surface.ROTATION_0
    }
  }

  override fun onSensorChanged(event: SensorEvent?) {
    event ?: return
    SensorManager.getRotationMatrixFromVector(rotation, event.values)

    // Screen rotation: the heading is where the top of the SCREEN points.
    val (x, y) = when (displayRotation()) {
      Surface.ROTATION_90 -> SensorManager.AXIS_Y to SensorManager.AXIS_MINUS_X
      Surface.ROTATION_180 -> SensorManager.AXIS_MINUS_X to SensorManager.AXIS_MINUS_Y
      Surface.ROTATION_270 -> SensorManager.AXIS_MINUS_Y to SensorManager.AXIS_X
      else -> SensorManager.AXIS_X to SensorManager.AXIS_Y
    }
    SensorManager.remapCoordinateSystem(rotation, x, y, remapped)
    SensorManager.getOrientation(remapped, orientation)

    // Pitch near ±90° (phone standing up) makes the flat azimuth unstable.
    val pitchDeg = abs(Math.toDegrees(orientation[1].toDouble()))
    upright = if (upright) pitchDeg > 55 else pitchDeg > 65
    if (upright) {
      SensorManager.remapCoordinateSystem(remapped, SensorManager.AXIS_X, SensorManager.AXIS_Z, rotation)
      SensorManager.getOrientation(rotation, orientation)
    }

    val magnetic = Math.toDegrees(orientation[0].toDouble()).toFloat()
    val heading = ((magnetic + declination) % 360f + 360f) % 360f

    val now = System.currentTimeMillis()
    val moved = lastHeading < 0f || abs(((heading - lastHeading + 540f) % 360f) - 180f) >= 0.05f
    if (now - lastSent < 30 || !moved) return
    lastSent = now
    lastHeading = heading
    sendEvent("onHeading", bundleOf("trueHeading" to heading.toDouble(), "accuracy" to accuracy))
  }

  override fun onAccuracyChanged(sensor: Sensor?, newAccuracy: Int) {
    accuracy = newAccuracy
  }
}
