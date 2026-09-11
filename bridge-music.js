/* ==========================================
   PUENTE NATIVO CON CAPACITOR FILESYSTEM
   =========================================== */

async function abrirSeleccionMusica() {
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.Filesystem) {
    try {
      const { Filesystem } = Capacitor.Plugins;
      
      // Solicitar permisos de lectura en Android
      const status = await Filesystem.requestPermissions();
      
      if (status.publicStorage === 'granted' || status.publicStorage === 'prompt-with-rationale') {
        await cargarBibliotecaNativa();
      } else {
        alert("Se requieren permisos para acceder a la carpeta de música.");
      }
    } catch (e) {
      console.warn("Capacitor Filesystem no está disponible, usando fallback HTML standard", e);
      document.getElementById('folder-input').click();
    }
  } else {
    // Si se ejecuta en navegador web estándar
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
  window.coversAlbumes = {}; // Almacena URLs de las imágenes encontradas

  try {
    // Escaneo de la carpeta Music pública del móvil
    const result = await Filesystem.readdir({
      path: '',
      directory: Directory.Music
    });

    for (const item of result.files) {
      if (item.type === 'directory') {
        const nombreAlbum = item.name;
        biblioteca[nombreAlbum] = [];

        // Leer subcarpeta del álbum
        const subFolder = await Filesystem.readdir({
          path: item.name,
          directory: Directory.Music
        });

        for (const subItem of subFolder.files) {
          const extension = subItem.name.split('.').pop().toLowerCase();
          const nombreSinExt = subItem.name.replace(/\.[^/.]+$/, "");

          // 1. Detección de Archivos de Audio
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

          // 2. Regla de Cover: Si el nombre de la imagen coincide con el nombre del álbum
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
      }
    }

    renderAlbumsNativos();
    navigateTo('screen-albums');
  } catch (error) {
    console.error("Error al leer la carpeta de música:", error);
    alert("Error al acceder a las carpetas de música local.");
  }
}

function renderAlbumsNativos() {
  const container = document.getElementById('albums-container');
  container.innerHTML = '';
  const nombresAlbumes = Object.keys(biblioteca);

  if (nombresAlbumes.length === 0) {
    container.innerHTML = '<p style="grid-column: span 2; text-align:center; font-size:0.9rem; color:#9D9D9C;">No se detectaron álbumes en la carpeta Música.</p>';
    return;
  }

  nombresAlbumes.forEach(album => {
    const card = document.createElement('div');
    card.className = 'album-card-clean';

    // Regla de renderizado de la carátula
    if (window.coversAlbumes && window.coversAlbumes[album]) {
      // Si la cover coincide, inserta la imagen adaptada al contenedor
      card.innerHTML = `<img src="${window.coversAlbumes[album]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" alt="${album}">`;
    } else {
      // Si no hay cover coincidente, deja el texto formateado original
      card.innerText = formatearNombreAlbum(album);
    }

    card.onclick = () => {
      marcarBotonActivo(card);
      showSongs(album);
    };
    container.appendChild(card);
  });
}
