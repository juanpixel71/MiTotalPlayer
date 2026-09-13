let biblioteca = {};
let covers = {};
let albumActual = '';
let listaCancionesActual = [];
let indiceCancionActual = 0;
let emisorasRadio = [];
let indiceRadioActual = 0;

const audioElement = document.getElementById('audio-element');
const radioAudioElement = document.getElementById('radio-audio-element');
const seekBar = document.getElementById('seek-bar');
const radioSeekBar = document.getElementById('radio-seek-bar');
const videoElement = document.getElementById('tv-video');
let hlsInstance = null;

function salirDeAplicacion() {
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.App) {
    Capacitor.Plugins.App.exitApp();
  } else if (navigator.app && navigator.app.exitApp) {
    navigator.app.exitApp();
  } else {
    window.close();
  }
}

/* NAVEGACIÓN Y CONTROL GENERAL */
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  if (screenId === 'screen-home') {
    if (videoElement) {
      videoElement.pause();
    }
    if (hlsInstance) {
      hlsInstance.stop();
    }
    detenerMusica();
    if (radioAudioElement) {
      radioAudioElement.pause();
    }
  }
}

function marcarBotonActivo(elemento) {
  if (!elemento) return;
  const contenedor = elemento.closest('.grid-buttons, .albums-grid, .song-list');
  if (contenedor) {
    contenedor.querySelectorAll('.boton-canal, .album-card-clean, .song-item').forEach(b => b.classList.remove('active-item'));
  }
  elemento.classList.add('active-item');
}

/* TV HLS */
function loadChannel(url, btn) {
  marcarBotonActivo(btn);

  if (Hls.isSupported()) {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
    hlsInstance = new Hls();
    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(videoElement);
    
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      videoElement.play().catch(e => console.log("Error al reproducir HLS:", e));
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.details) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hlsInstance.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hlsInstance.recoverMediaError();
            break;
          default:
            hlsInstance.destroy();
            break;
        }
      }
    });
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = url;
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play().catch(e => console.log("Error al reproducir nativo:", e));
    });
  }
}

/* MÚSICA */
function ejecutarAccionMusica() {
  if (typeof window.cargarBibliotecaBridge === 'function' && Object.keys(biblioteca).length === 0) {
    window.cargarBibliotecaBridge();
  }
  renderAlbums();
  navigateTo('screen-albums');
}

window.recibirBibliotecaNativa = function(bibliotecaRecibida, coversRecibidas) {
  biblioteca = bibliotecaRecibida || {};
  covers = coversRecibidas || {};
  renderAlbums();
  navigateTo('screen-albums');
};

function renderAlbums() {
  const container = document.getElementById('albums-container');
  if (!container) return;
  container.innerHTML = '';
  const nombresAlbumes = Object.keys(biblioteca).sort();

  if (nombresAlbumes.length === 0) {
    container.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#9D9D9C; padding: 20px;">No se encontraron canciones en el dispositivo.</p>';
    return;
  }

  nombresAlbumes.forEach(album => {
    const card = document.createElement('div');
    card.className = 'album-card-clean';
    card.innerText = album.replace(/\s*\((.*?)\)\s*/g, "\n($1)\n");

    const claveAlbum = album.toLowerCase();
    if (covers[claveAlbum]) {
      card.style.backgroundImage = `url('${covers[claveAlbum]}')`;
      card.style.color = 'transparent';
    }

    card.onclick = () => {
      marcarBotonActivo(card);
      showSongs(album);
    };
    container.appendChild(card);
  });
}

function showSongs(album) {
  albumActual = album;
  listaCancionesActual = biblioteca[album] || [];
  const headerElem = document.getElementById('album-header');
  if (headerElem) headerElem.innerText = album;
  
  const container = document.getElementById('songs-container');
  if (!container) return;
  container.innerHTML = '';

  listaCancionesActual.forEach((song, idx) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerText = (typeof song === 'object' ? (song.nombre || song.file) : song) || 'Canción sin nombre';
    item.onclick = () => {
      marcarBotonActivo(item);
      indiceCancionActual = idx;
      playSong(song);
    };
    container.appendChild(item);
  });

  navigateTo('screen-songs');
}

function playSong(song) {
  let nombre = '';
  let url = '';

  if (typeof song === 'object' && song !== null) {
    nombre = song.nombre || song.title || 'Pista desconocida';
    url = song.archivo || song.path || song.url || '';
  } else {
    nombre = String(song);
    url = String(song);
  }

  if (url && !url.startsWith('http') && !url.startsWith('blob:')) {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.convertFileSrc === 'function') {
      url = Capacitor.convertFileSrc(url);
    } else if (!url.startsWith('file://') && !url.startsWith('content://') && !url.startsWith('capacitor://')) {
      url = 'file://' + url;
    }
  }

  const titleElem = document.getElementById('player-song-title');
  const infoElem = document.getElementById('player-album-info');
  if (titleElem) titleElem.innerText = nombre;
  if (infoElem) infoElem.innerText = albumActual;

  const playerCover = document.getElementById('player-cover');
  const playerCoverIcon = document.getElementById('player-cover-icon');
  const claveAlbum = albumActual.toLowerCase();

  if (playerCover && playerCoverIcon) {
    if (covers[claveAlbum]) {
      playerCover.style.backgroundImage = `url('${covers[claveAlbum]}')`;
      playerCoverIcon.style.display = 'none';
    } else {
      playerCover.style.backgroundImage = 'none';
      playerCoverIcon.style.display = 'block';
    }
  }
  
  if (audioElement) {
    audioElement.pause();
    audioElement.src = url;
    audioElement.load();
    
    audioElement.play().then(() => {
      const btnPlay = document.getElementById('btn-play-pause');
      if (btnPlay) btnPlay.innerText = '⏸';
    }).catch(error => {
      console.log("Error al reproducir audio:", error);
      const btnPlay = document.getElementById('btn-play-pause');
      if (btnPlay) btnPlay.innerText = '▶';
    });
  }

  navigateTo('screen-player');
}

function togglePlayMusic() {
  if (!audioElement) return;
  const btnPlay = document.getElementById('btn-play-pause');
  if (audioElement.paused) {
    audioElement.play().then(() => {
      if (btnPlay) btnPlay.innerText = '⏸';
    }).catch(e => console.log("Error al reanudar:", e));
  } else {
    audioElement.pause();
    if (btnPlay) btnPlay.innerText = '▶';
  }
}

function detenerMusica() {
  if (!audioElement) return;
  audioElement.pause();
  audioElement.currentTime = 0;
  const btnPlay = document.getElementById('btn-play-pause');
  if (btnPlay) btnPlay.innerText = '▶';
}

function pararYVolverCanciones() {
  detenerMusica();
  navigateTo('screen-songs');
}

function prevSong() {
  if (listaCancionesActual.length === 0) return;
  indiceCancionActual = (indiceCancionActual - 1 + listaCancionesActual.length) % listaCancionesActual.length;
  playSong(listaCancionesActual[indiceCancionActual]);
}

function nextSong() {
  if (listaCancionesActual.length === 0) return;
  indiceCancionActual = (indiceCancionActual + 1) % listaCancionesActual.length;
  playSong(listaCancionesActual[indiceCancionActual]);
}

if (audioElement) {
  audioElement.addEventListener('ended', nextSong);
  audioElement.addEventListener('timeupdate', () => {
    if (!isNaN(audioElement.duration) && seekBar) {
      seekBar.max = Math.floor(audioElement.duration);
      seekBar.value = Math.floor(audioElement.currentTime);
      const currTime = document.getElementById('current-time');
      const totTime = document.getElementById('total-time');
      if (currTime) currTime.innerText = formatTime(audioElement.currentTime);
      if (totTime) totTime.innerText = formatTime(audioElement.duration);
    }
  });
}

if (seekBar) {
  seekBar.addEventListener('input', () => { 
    if (audioElement) audioElement.currentTime = seekBar.value; 
  });
}

/* RADIO */
window.addEventListener('DOMContentLoaded', () => {
  emisorasRadio = Array.from(document.querySelectorAll('#radio-buttons-container .boton-canal'));
});

function playRadio(elemento, url) {
  marcarBotonActivo(elemento);
  if (elemento) indiceRadioActual = emisorasRadio.indexOf(elemento);
  if (radioAudioElement) {
    radioAudioElement.src = url;
    radioAudioElement.play();
    const btnRadioPlay = document.getElementById('btn-radio-play');
    if (btnRadioPlay) btnRadioPlay.innerText = '⏸';
  }
}

function togglePlayRadio() {
  if (!radioAudioElement) return;
  const btnRadioPlay = document.getElementById('btn-radio-play');
  if (radioAudioElement.paused) {
    radioAudioElement.play();
    if (btnRadioPlay) btnRadioPlay.innerText = '⏸';
  } else {
    radioAudioElement.pause();
    if (btnRadioPlay) btnRadioPlay.innerText = '▶';
  }
}

function prevRadio() {
  if (emisorasRadio.length === 0) return;
  indiceRadioActual = (indiceRadioActual - 1 + emisorasRadio.length) % emisorasRadio.length;
  if (emisorasRadio[indiceRadioActual]) emisorasRadio[indiceRadioActual].click();
}

function nextRadio() {
  if (emisorasRadio.length === 0) return;
  indiceRadioActual = (indiceRadioActual + 1) % emisorasRadio.length;
  if (emisorasRadio[indiceRadioActual]) emisorasRadio[indiceRadioActual].click();
}

if (radioAudioElement) {
  radioAudioElement.addEventListener('timeupdate', () => {
    if (!isNaN(radioAudioElement.duration) && isFinite(radioAudioElement.duration)) {
      if (radioSeekBar) radioSeekBar.max = Math.floor(radioAudioElement.duration);
      if (radioSeekBar) radioSeekBar.value = Math.floor(radioAudioElement.currentTime);
      const totTime = document.getElementById('radio-total-time');
      if (totTime) totTime.innerText = formatTime(radioAudioElement.duration);
    } else {
      if (radioSeekBar) {
        radioSeekBar.max = 100;
        radioSeekBar.value = 100;
      }
      const totTime = document.getElementById('radio-total-time');
      if (totTime) totTime.innerText = 'LIVE';
    }
    const currTime = document.getElementById('radio-current-time');
    if (currTime) currTime.innerText = formatTime(radioAudioElement.currentTime);
  });
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  let min = Math.floor(seconds / 60);
  let sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

/* CONTROLES DE REPRODUCCIÓN INTEGRADOS PARA LA TV */
let emisorasTV = [];
let indiceTVActual = 0;

window.addEventListener('DOMContentLoaded', () => {
  // Capturamos los botones de los canales de TV para poder saltar entre ellos
  emisorasTV = Array.from(document.querySelectorAll('#screen-tv .grid-buttons .boton-canal'));
});

// Función para el botón central de Play/Pausa de la TV
function togglePlayTV() {
  if (!videoElement) return;
  const btnTVPlay = document.getElementById('btn-tv-play');
  if (videoElement.paused) {
    videoElement.play().then(() => {
      if (btnTVPlay) btnTVPlay.innerText = '⏸';
    }).catch(e => console.log("Error al reanudar TV:", e));
  } else {
    videoElement.pause();
    if (btnTVPlay) btnTVPlay.innerText = '▶';
  }
}

// Función para saltar al canal Anterior
function prevChannel() {
  if (emisorasTV.length === 0) return;
  indiceTVActual = (indiceTVActual - 1 + emisorasTV.length) % emisorasTV.length;
  if (emisorasTV[indiceTVActual]) {
    emisorasTV[indiceTVActual].click();
    const btnTVPlay = document.getElementById('btn-tv-play');
    if (btnTVPlay) btnTVPlay.innerText = '⏸';
  }
}

// Función para saltar al canal Siguiente
function nextChannel() {
  if (emisorasTV.length === 0) return;
  indiceTVActual = (indiceTVActual + 1) % emisorasTV.length;
  if (emisorasTV[indiceTVActual]) {
    emisorasTV[indiceTVActual].click();
    const btnTVPlay = document.getElementById('btn-tv-play');
    if (btnTVPlay) btnTVPlay.innerText = '⏸';
  }
}

