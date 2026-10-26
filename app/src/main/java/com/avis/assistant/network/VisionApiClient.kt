package com.avis.assistant.network

import android.graphics.Bitmap
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit

class VisionApiClient(
    private var baseUrl: String = "http://10.0.2.2:3001"
) {
    private val tag = "AvisApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    fun setBaseUrl(url: String) {
        baseUrl = url.trimEnd('/')
    }

    suspend fun checkHealth(): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/health")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: ""
                val isOk = response.isSuccessful && body.contains("ok", ignoreCase = true)
                Log.d(tag, "Health check result: $isOk")
                isOk
            }
        } catch (e: Exception) {
            Log.w(tag, "Health check failed: ${e.message}")
            false
        }
    }

    suspend fun askAssistant(
        bitmap: Bitmap,
        question: String
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            // Downscale bitmap if too large to conserve bandwidth and speed up processing
            val scaledBitmap = scaleBitmapIfNeeded(bitmap, 1024)
            val base64Image = bitmapToBase64(scaledBitmap)

            val payload = JSONObject().apply {
                put("question", question)
                put("image", base64Image)
            }

            val request = Request.Builder()
                .url("$baseUrl/api/ask")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    val errorMsg = try {
                        JSONObject(body).optString("error", "Server responded with HTTP ${response.code}")
                    } catch (_: Exception) {
                        "Server error HTTP ${response.code}"
                    }
                    return@withContext Result.failure(Exception(errorMsg))
                }

                val json = JSONObject(body)
                val answer = json.optString("answer", "").trim()
                if (answer.isNotEmpty()) {
                    Result.success(answer)
                } else {
                    Result.failure(Exception("AI provider returned an empty answer."))
                }
            }
        } catch (e: Exception) {
            Log.e(tag, "Ask assistant call failed: ${e.message}", e)
            Result.failure(Exception("Cloud assistant unavailable: ${e.localizedMessage ?: "Connection error"}"))
        }
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, stream)
        val byteArray = stream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    private fun scaleBitmapIfNeeded(source: Bitmap, maxDimension: Int): Bitmap {
        val width = source.width
        val height = source.height
        if (width <= maxDimension && height <= maxDimension) {
            return source
        }
        val ratio = width.toFloat() / height.toFloat()
        val newWidth: Int
        val newHeight: Int
        if (width > height) {
            newWidth = maxDimension
            newHeight = (maxDimension / ratio).toInt()
        } else {
            newHeight = maxDimension
            newWidth = (maxDimension * ratio).toInt()
        }
        return Bitmap.createScaledBitmap(source, newWidth, newHeight, true)
    }
}
