/* ==========================================
   PUENTE NATIVO CON CAPACITOR
   =========================================== */

let wakeLockSentinel = null;

// Control Inmersivo y KeepAwake para TV-NEWS
window.gestionarModoPantalla = async function(screenId) {
  if (screenId === 'screen-tv') {
    // 1. Ocultar barra de estado / notch en Android
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.StatusBar) {
      try { await Capacitor.Plugins.StatusBar.hide(); } catch(e){}
    }

    // 2. Mantener la pantalla activa sin apagar
    if ('wakeLock' in navigator) {
      try { wakeLockSentinel = await navigator.wakeLock.request('screen'); } catch(e){}
    }
  } else {
    // Restaurar modo normal
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
      const { Filesystem } = Capacitor.Plugins;
      const status = await Filesystem.requestPermissions();
      
      if (status.publicStorage === 'granted' || status.publicStorage === 'prompt-with-rationale') {
        await cargarBibliotecaNativa();
      } else {
        await cargarBibliotecaNativa();
      }
    } catch (e) {
      console.warn("Usando fallback de lectura nativa direct path", e);
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

async function cargarBibliotecaNativa() {
  const { Filesystem, Directory } = Capacitor.Plugins;
  biblioteca = {};
  window.coversAlbumes = {};

  try {
    const result = await Filesystem.readdir({
      path: '',
      directory: Directory.Music
    });

    for (const item of result.files) {
      const isFolder = item.type === 'directory' || !item.name.includes('.');
      
      if (isFolder) {
        const nombreAlbum = item.name;
        biblioteca[nombreAlbum] = [];

        try {
          const subFolder = await Filesystem.readdir({
            path: item.name,
            directory: Directory.Music
          });

          for (const subItem of subFolder.files) {
            const extension = subItem.name.split('.').pop().toLowerCase();
            const nombreSinExt = subItem.name.replace(/\.[^/.]+$/, "");

            if (['mp3', 'aac', 'm4a', 'wav', 'ogg', 'flac'].includes(extension)) {
              const fileUri = await Filesystem.getUri({
                path: `${item.name}/${subItem.name}`,
                directory: Directory.Music
              });

              biblioteca[nombreAlbum].push({
                nombre: nombreSinExt,
                archivo: Capacitor.convertFileSrc(fileUri.uri)
              });
            }

            if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
              if (nombreSinExt.toLowerCase() === nombreAlbum.toLowerCase() || nombreSinExt.toLowerCase() === 'cover' || nombreSinExt.toLowerCase() === 'folder') {
                const imgUri = await Filesystem.getUri({
                  path: `${item.name}/${subItem.name}`,
                  directory: Directory.Music
                });
                window.coversAlbumes[nombreAlbum] = Capacitor.convertFileSrc(imgUri.uri);
              }
            }
          }
        } catch(e) {
          console.warn("Subcarpeta no accesible:", item.name);
        }
      }
    }

    renderAlbumsNativos();
    navigateTo('screen-albums');
  } catch (error) {
    console.error("Error al leer la carpeta de música:", error);
    alert("Por favor, asegúrate de colocar tus carpetas de música dentro de la carpeta 'Música' (Music) de tu móvil.");
  }
}

function renderAlbumsNativos() {
  const container = document.getElementById('albums-container');
  container.innerHTML = '';
  const nombresAlbumes = Object.keys(biblioteca);

  if (nombresAlbumes.length === 0) {
    container.innerHTML = '<p style="grid-column: span 2; text-align:center; font-size:0.9rem; color:#9D9D9C;">No se detectaron carpetas de álbumes en la carpeta Música.</p>';
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
      marcarBotonActivo(card);
      showSongs(album);
    };
    container.appendChild(card);
  });
}
