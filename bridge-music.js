// ==========================================================================
// 4. FUNCIÓN PARA SELECCIONAR Y REPRODUCIR CANCIÓN AUTOMÁTICAMENTE
// ==========================================================================
function seleccionarCancion(urlCancion, titulo, artista) {
    // 1. Obtener la referencia única al elemento Audio de HTML5
    let audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer) {
        audioPlayer = document.createElement('audio');
        audioPlayer.id = 'audio-player';
        document.body.appendChild(audioPlayer);
    }

    // 2. Asignar nueva ruta e información a la interfaz
    audioPlayer.src = urlCancion;
    
    // Actualizar textos de interfaz si existen
    const txtTitulo = document.getElementById('player-title');
    const txtArtista = document.getElementById('player-artist');
    if(txtTitulo) txtTitulo.innerText = titulo;
    if(txtArtista) txtArtista.innerText = artista;

    // 3. Forzar la carga física del nuevo archivo multimedia
    audioPlayer.load();

    // 4. Cambiar visualmente a la pantalla del reproductor de música
    mostrarPantalla('music-player-screen'); 

    // 5. Promesa de reproducción asíncrona segura para evitar bloqueos del navegador/Capacitor
    audioPlayer.play()
        .then(() => {
            console.log("Reproduciendo con éxito: " + titulo);
            actualizarBotonPlayPause(true); // Cambia el icono a "Pausa"
        })
        .catch(error => {
            console.error("Error al iniciar reproducción automática: ", error);
            // Intento alternativo tras interacción limpia
            setTimeout(() => { audioPlayer.play(); }, 150);
        });
}


// bridge-music.js

window.cargarBibliotecaBridge = function() {
  console.log("Iniciando carga de música desde el puente...");
  
  // 1. Si existe interfaz Java/Kotlin nativa (AndroidBridge)
  if (window.AndroidBridge && typeof window.AndroidBridge.cargarMusica === 'function') {
    window.AndroidBridge.cargarMusica();
    return;
  }

  // 2. Si existe función global de escaneo nativo
  if (typeof window.cargarMusicaNativa === 'function') {
    window.cargarMusicaNativa();
    return;
  }

  // 3. Fallback: Abrir selector de archivos local si no hay puente nativo activo
  const folderInput = document.getElementById('folder-input');
  if (folderInput) {
    folderInput.click();
  } else {
    if (typeof window.recibirBibliotecaNativa === 'function') {
      window.recibirBibliotecaNativa({}, {});
    }
  }
};

window.abrirSeleccionMusicaNativa = function() {
  window.cargarBibliotecaBridge();
};

// Manejador del selector de archivos (Fallback Web / Almacenamiento local)
window.cargarBibliotecaLocal = function(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  let nuevaBiblioteca = {};
  let nuevasCovers = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = file.webkitRelativePath || file.name;
    const partes = path.split('/');

    // Si está dentro de una carpeta, usamos esa carpeta como Álbum
    let album = partes.length > 1 ? partes[partes.length - 2] : 'Varios';
    
    if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a') || file.name.endsWith('.wav')) {
      if (!nuevaBiblioteca[album]) {
        nuevaBiblioteca[album] = [];
      }
      const fileURL = URL.createObjectURL(file);
      nuevaBiblioteca[album].push({
        nombre: file.name.replace(/\.[^/.]+$/, ""),
        archivo: fileURL
      });
    } else if (file.type.startsWith('image/') || file.name.endsWith('.jpg') || file.name.endsWith('.png')) {
      const coverURL = URL.createObjectURL(file);
      nuevasCovers[album.toLowerCase()] = coverURL;
    }
  }

  if (typeof window.recibirBibliotecaNativa === 'function') {
    window.recibirBibliotecaNativa(nuevaBiblioteca, nuevasCovers);
  }
};
