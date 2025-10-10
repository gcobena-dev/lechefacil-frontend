package com.lechefacil.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            // Ensure WebView accepts cookies and third‑party cookies for cross-site refresh flow
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                cookieManager.setAcceptThirdPartyCookies(webView, true);
                WebSettings settings = webView.getSettings();
                // Keep mixed content compatible if API URL is https and app origin is https://localhost
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            }
        } catch (Exception ignored) {
        }
    }
}
