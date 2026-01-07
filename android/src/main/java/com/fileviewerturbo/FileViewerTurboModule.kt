package com.fileviewerturbo

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.MimeTypeMap
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

@ReactModule(name = FileViewerTurboModule.NAME)
class FileViewerTurboModule(reactContext: ReactApplicationContext) :
  NativeFileViewerTurboSpec(reactContext) {

  companion object {
    const val NAME = "FileViewerTurbo"
    private const val SHOW_OPEN_WITH_DIALOG = "showOpenWithDialog"
    private const val SHOW_STORE_SUGGESTIONS = "showAppsSuggestions"
    private const val DISMISS_EVENT = "onViewerDidDismiss"
    private const val RN_FILE_VIEWER_REQUEST = 33341
  }

  init {
    val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
      override fun onActivityResult(activity: android.app.Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit(DISMISS_EVENT, null)
      }
    }
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = NAME

  override fun open(path: String?, options: ReadableMap?, promise: Promise?) {
    if (path == null || options == null || promise == null) {
      promise?.reject("FileViewerTurbo:open", "Invalid arguments")
      return
    }

    var contentUri: Uri? = null
    val showOpenWithDialog = options.hasKey(SHOW_OPEN_WITH_DIALOG) && options.getBoolean(SHOW_OPEN_WITH_DIALOG)
    val showStoreSuggestions = options.hasKey(SHOW_STORE_SUGGESTIONS) && options.getBoolean(SHOW_STORE_SUGGESTIONS)

    if (path.startsWith("content://")) {
      contentUri = Uri.parse(path)
    } else {
      val newFile = File(path)

      val activity = reactApplicationContext.currentActivity
      if (activity == null) {
        promise.reject("FileViewerTurbo:open", "Activity doesn't exist")
        return
      }

      try {
        val packageName = activity.packageName
        val authority = "$packageName.provider"
        contentUri = FileProvider.getUriForFile(activity, authority, newFile)
      } catch (e: IllegalArgumentException) {
        promise.reject("FileViewerTurbo:open", e)
        return
      }
    }

    if (contentUri == null) {
      promise.reject("FileViewerTurbo:open", "Invalid file")
      return
    }

    val extension = MimeTypeMap.getFileExtensionFromUrl(path).lowercase()
    val mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)

    val shareIntent = Intent().apply {
      action = Intent.ACTION_VIEW
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      setDataAndType(contentUri, mimeType)
      putExtra(Intent.EXTRA_STREAM, contentUri)
    }

    val intentActivity = if (showOpenWithDialog) {
      Intent.createChooser(shareIntent, "Open with")
    } else {
      shareIntent
    }

    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("FileViewerTurbo:open", "Activity doesn't exist")
      return
    }

    val pm: PackageManager = activity.packageManager

    if (shareIntent.resolveActivity(pm) != null) {
      try {
        activity.startActivityForResult(intentActivity, RN_FILE_VIEWER_REQUEST)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("FileViewerTurbo:open", e)
      }
    } else {
      try {
        if (showStoreSuggestions) {
          if (mimeType == null) {
            promise.reject("FileViewerTurbo:open", "It wasn't possible to detect the type of the file")
            return
          }
          val storeIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=$mimeType&c=apps"))
          activity.startActivity(storeIntent)
        }
        promise.reject("FileViewerTurbo:open", "No app associated with this mime type")
      } catch (e: Exception) {
        promise.reject("FileViewerTurbo:open", e)
      }
    }
  }

  override fun addListener(eventType: String?) {
    // Required for RN event emitter
  }

  override fun removeListeners(count: Double) {
    // Required for RN event emitter
  }
}
