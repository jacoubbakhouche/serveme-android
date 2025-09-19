package com.serveme.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// استيراد حزم الإضافات التي قمت بتثبيتها
import com.capacitorfirebase.authentication.FirebaseAuthentication;
import com.getcapacitor.community.facebooklogin.FacebookLogin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // هنا نقوم بتهيئة وتسجيل الإضافات عند بدء تشغيل التطبيق
        // حتى يتمكن Capacitor من استخدامها
        registerPlugin(FirebaseAuthentication.class); // إضافة المصادقة من Firebase (لتسجيل الدخول بجوجل)
        registerPlugin(FacebookLogin.class);          // إضافة تسجيل الدخول بفيسبوك
    }
}
