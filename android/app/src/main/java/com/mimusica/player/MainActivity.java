package com.mimusica.player;

import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.util.Base64;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registrar el puente JS de Android cuando la WebView cargue
        this.bridge.getWebView().addJavascriptInterface(new WebAppInterface(), "AndroidBridge");
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void cargarMusica() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    escanearCarpetaMiMusica();
                }
            });
        }
    }

    private void escanearCarpetaMiMusica() {
        JSONObject biblioteca = new JSONObject();
        JSONObject covers = new JSONObject();

        try {
            File miMusicaDir = new File(Environment.getExternalStorageDirectory(), "MiMusica");

            if (miMusicaDir.exists() && miMusicaDir.isDirectory()) {
                File[] albumDirs = miMusicaDir.listFiles();
                if (albumDirs != null) {
                    for (File albumDir : albumDirs) {
                        if (albumDir.isDirectory()) {
                            String albumName = albumDir.getName();
                            JSONArray cancionesArray = new JSONArray();

                            File[] files = albumDir.listFiles();
                            if (files != null) {
                                for (File file : files) {
                                    String fileName = file.getName().toLowerCase();
                                    
                                    // Detectar Canciones
                                    if (fileName.endsWith(".mp3") || fileName.endsWith(".wav") || fileName.endsWith(".m4a") || fileName.endsWith(".aac")) {
                                        JSONObject cancion = new JSONObject();
                                        cancion.put("nombre", file.getName().replace(/\.[^/.]+$/, ""));
                                        cancion.put("archivo", "file://" + file.getAbsolutePath());
                                        cancionesArray.put(cancion);
                                    } 
                                    // Detectar Portada de Álbum
                                    else if (fileName.endsWith(".jpg") || fileName.endsWith(".png") || fileName.endsWith(".jpeg")) {
                                        try {
                                            FileInputStream fis = new FileInputStream(file);
                                            byte[] bytes = new byte[(int) file.length()];
                                            fis.read(bytes);
                                            fis.close();
                                            String base64Image = Base64.getEncoder().encodeToString(bytes);
                                            covers.put(albumName.toLowerCase(), "data:image/jpeg;base64," + base64Image);
                                        } catch (Exception e) {
                                            e.printStackTrace();
                                        }
                                    }
                                }
                            }

                            if (cancionesArray.length() > 0) {
                                biblioteca.put(albumName, cancionesArray);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Devolver la respuesta a la interfaz web JavaScript
        WebView webView = this.bridge.getWebView();
        String jsCall = String.format("window.recibirBibliotecaNativa(%s, %s);", biblioteca.toString(), covers.toString());
        webView.evaluateJavascript(jsCall, null);
    }
}
