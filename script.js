package com.routify.premium;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void Bundle) {
        super.onCreate(savedInstanceState);
        
        // Cria a WebView nativa ocupando a tela inteira
        webView = new WebView(this);
        setContentView(webView);

        // Configurações críticas de performance e compatibilidade
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true); // Permite o script.js rodar
        webSettings.setDomStorageEnabled(true);  // Permite o Leaflet guardar cache do mapa
        webSettings.setAllowFileAccess(true);    // Permite abrir o HTML localmente
        webSettings.setAllowContentAccess(true);
        
        // Garante que links (como o do Waze) não abram o navegador externo por padrão, 
        // a menos que disparados pelo JS
        webView.setWebViewClient(new WebViewClient());

        // Carrega os seus arquivos locais guardados na pasta 'assets' do projeto Android
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        // Se o usuário clicar em voltar no celular, ele navega no app em vez de fechar
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

