/* ==========================================
   PUENTE NATIVO CON CAPACITOR
   =========================================== */

let wakeLockSentinel = null;

// Control Inmersivo y StatusBar (Puntos 3.2, 4 y 7)
window.gestionarModoPantalla = async function(screenId) {
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.StatusBar) {
    try {
      // Punto 7: Mantener siempre el fondo de barra superior en #3C3C3B
      await Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#3C3C3B' });
    } catch(e){}
  }

  // Puntos 3.2 y 4: Pantalla completa en TV-NEWS y PANTALLA AMPLIADA
  if (screenId === 'screen-tv' || screenId === 'screen-player') {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.StatusBar) {
      try { await Capacitor.Plugins.StatusBar.hide(); } catch(e){}
    }

    if (screenId === 'screen-tv') {
      if ('wakeLock' in navigator) {
        try { wakeLockSentinel = await navigator.wakeLock.request('screen'); } catch(e){}
      }
    }
  } else {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.StatusBar) {
      try { await Capacitor.Plugins.StatusBar.show(); } catch(e){}
    }

    if (wakeLockSentinel !== null) {
      try { await wakeLockSentinel.release(); wakeLockSentinel = null; } catch(e){}
    }
  }
};

async function abrirSeleccionMusica() {
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.Filesystem) {
    try {
      await cargarBibliotecaNativa();
    } catch (e) {
      console.warn("Error leyendo la ruta nativa:", e);
      await cargarBibliotecaNativa();
    }
  } else {
    if (Object.keys(biblioteca).length > 0) {
      navigateTo('screen-albums');
    } else {
      document.getElementById('folder-input').click();
    }
  }
}

// Punto 5: Lectura directa desde /storage/emulated/0/MiMusica
async function cargarBibliotecaNativa() {
  const { Filesystem } = Capacitor.Plugins;
  biblioteca = {};
  window.coversAlbumes = {};

  const RUTA_MIMUSICA = '/storage/emulated/0/MiMusica';

  try {
    const result = await Filesystem.readdir({
      path: RUTA_MIMUSICA
    });

    for (const item of result.files) {
      const isFolder = item.type === 'directory' || !item.name.includes('.');
      
      // Si no es la carpeta de COVERS genérica, lo tratamos como Álbum
      if (isFolder && item.name.toUpperCase() !== 'COVERS') {
        const nombreAlbum = item.name;
        biblioteca[nombreAlbum] = [];

        try {
          const subFolder = await Filesystem.readdir({
            path: `${RUTA_MIMUSICA}/${item.name}`
          });

          for (const subItem of subFolder.files) {
            const extension = subItem.name.split('.').pop().toLowerCase();
            const nombreSinExt = subItem.name.replace(/\.[^/.]+$/, "");

            if (['mp3', 'aac', 'm4a', 'wav', 'ogg', 'flac'].includes(extension)) {
              const fileUri = await Filesystem.getUri({
                path: `${RUTA_MIMUSICA}/${item.name}/${subItem.name}`
              });

              biblioteca[nombreAlbum].push({
                nombre: nombreSinExt,
                archivo: Capacitor.convertFileSrc(fileUri.uri)
              });
            }

            if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
              const imgUri = await Filesystem.getUri({
                path: `${RUTA_MIMUSICA}/${item.name}/${subItem.name}`
              });
              window.coversAlbumes[nombreAlbum] = Capacitor.convertFileSrc(imgUri.uri);
            }
          }
        } catch(e) {
          console.warn("Subcarpeta no accesible:", item.name);
        }
      }
    }

    // Buscar en la carpeta /MiMusica/COVERS si existe
    try {
      const coversFolder = await Filesystem.readdir({
        path: `${RUTA_MIMUSICA}/COVERS`
      });

      for (const coverItem of coversFolder.files) {
        const extension = coverItem.name.split('.').pop().toLowerCase();
        const nombreSinExt = coverItem.name.replace(/\.[^/.]+$/, "");

        if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
          const imgUri = await Filesystem.getUri({
            path: `${RUTA_MIMUSICA}/COVERS/${coverItem.name}`
          });
          
          // Asigna la portada al álbum si coincide el nombre
          Object.keys(biblioteca).forEach(album => {
            if (album.toLowerCase() === nombreSinExt.toLowerCase()) {
              window.coversAlbumes[album] = Capacitor.convertFileSrc(imgUri.uri);
            }
          });
        }
      }
    } catch(e) {
      console.log("No se encontró la subcarpeta COVERS o está vacía.");
    }

    renderAlbumsNativos();
    navigateTo('screen-albums');
  } catch (error) {
    console.error("Error al leer la carpeta MiMusica:", error);
    alert("Por favor, asegúrate de tener creada la carpeta 'MiMusica' en el almacenamiento interno con tus álbumes dentro.");
  }
}

function renderAlbumsNativos() {
  const container = document.getElementById('albums-container');
  container.innerHTML = '';
  const nombresAlbumes = Object.keys(biblioteca);

  if (nombresAlbumes.length === 0) {
    container.innerHTML = '<p style="grid-column: span 2; text-align:center; font-size:0.9rem; color:#9D9D9C;">No se detectaron carpetas de álbumes en /MiMusica.</p>';
    return;
  }

  nombresAlbumes.forEach(album => {
    const card = document.createElement('div');
    card.className = 'album-card-clean';

    if (window.coversAlbumes && window.coversAlbumes[album]) {
      card.innerHTML = `<img src="${window.coversAlbumes[album]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" alt="${album}">`;
    } else {
      card.innerText = formatearNombreAlbum(album);
    }

    card.onclick = () => {
      document.querySelectorAll('.album-card-clean').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      showSongs(album);
    };
    container.appendChild(card);
  });
}
