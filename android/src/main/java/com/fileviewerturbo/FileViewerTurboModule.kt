package com.fileviewerturbo

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import java.io.File

class FileViewerTurboModule(reactContext: ReactApplicationContext) :
  NativeFileViewerTurboSpec(reactContext) {

  companion object {
    const val NAME = NativeFileViewerTurboSpec.NAME
    private const val E_OPEN = "FileViewerTurbo:open"
    private const val SHOW_OPEN_WITH_DIALOG = "showOpenWithDialog"
    private const val SHOW_STORE_SUGGESTIONS = "showAppsSuggestions"
    private const val RN_FILE_VIEWER_REQUEST = 33341

    fun fileProviderAuthority(context: Context): String = "${context.packageName}.fileviewerturbo.provider"
  }

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == RN_FILE_VIEWER_REQUEST) {
          emitOnViewerDidDismiss()
        }
      }
    }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(activityEventListener)
    super.invalidate()
  }

  override fun open(path: String?, options: ReadableMap?, promise: Promise?) {
    if (path == null || options == null || promise == null) {
      promise?.reject(E_OPEN, "Invalid arguments")
      return
    }

    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject(E_OPEN, "Activity doesn't exist")
      return
    }

    val showOpenWithDialog = options.optBoolean(SHOW_OPEN_WITH_DIALOG)
    val showStoreSuggestions = options.optBoolean(SHOW_STORE_SUGGESTIONS)
    val isContentUri = path.startsWith("content://")

    val contentUri: Uri =
      if (isContentUri) {
        Uri.parse(path)
      } else {
        try {
          FileProvider.getUriForFile(activity, fileProviderAuthority(activity), File(path))
        } catch (e: IllegalArgumentException) {
          promise.reject(E_OPEN, e)
          return
        }
      }

    val providerType = if (isContentUri) {
      try {
        activity.contentResolver.getType(contentUri)
      } catch (e: SecurityException) {
        promise.reject(E_OPEN, e)
        return
      } catch (e: Exception) {
        null
      }
    } else {
      null
    }
    val mimeType = providerType
      ?: MimeTypeMap.getSingleton().getMimeTypeFromExtension(File(contentUri.lastPathSegment ?: path).extension.lowercase())

    val viewIntent = Intent(Intent.ACTION_VIEW).apply {
      setDataAndType(contentUri, mimeType)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    try {
      if (showOpenWithDialog) {
        if (viewIntent.resolveActivity(activity.packageManager) == null) {
          throw ActivityNotFoundException()
        }
        activity.startActivityForResult(Intent.createChooser(viewIntent, "Open with"), RN_FILE_VIEWER_REQUEST)
      } else {
        activity.startActivityForResult(viewIntent, RN_FILE_VIEWER_REQUEST)
      }
      promise.resolve(null)
    } catch (e: ActivityNotFoundException) {
      try {
        if (showStoreSuggestions) {
          if (mimeType == null) {
            promise.reject(E_OPEN, "It wasn't possible to detect the type of the file")
            return
          }
          activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=$mimeType&c=apps")))
        }
        promise.reject(E_OPEN, "No app associated with this mime type")
      } catch (e: Exception) {
        promise.reject(E_OPEN, e)
      }
    } catch (e: Exception) {
      promise.reject(E_OPEN, e)
    }
  }

  private fun ReadableMap.optBoolean(key: String): Boolean =
    hasKey(key) && !isNull(key) && getBoolean(key)
}
