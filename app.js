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

function salirDeAplicacion() {
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.App) {
    Capacitor.Plugins.App.exitApp();
  } else if (navigator.app && navigator.app.exitApp) {
    navigator.app.exitApp();
  } else {
    window.close();
  }
}

var tvPlayer = videojs('player', { fluid: true, html5: { vhs: { overrideNative: true } } });

function loadChannel(url, btn) {
  tvPlayer.pause();
  tvPlayer.reset();
  tvPlayer.src({ src: url, type: 'application/x-mpegURL' });
  tvPlayer.load();
  tvPlayer.play().catch(function(e){});
  marcarBotonActivo(btn);
}

function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  if (screenId === 'screen-home') {
    tvPlayer.pause();
    detenerMusica();
    radioAudioElement.pause();
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

function ejecutarAccionMusica() {
  if (Object.keys(biblioteca).length > 0) {
    navigateTo('screen-albums');
    return;
  }

  if (typeof window.cargarBibliotecaBridge === 'function') {
    window.cargarBibliotecaBridge();
  } else {
    renderAlbums();
    navigateTo('screen-albums');
  }
}

window.recibirBibliotecaNativa = function(bibliotecaRecibida, coversRecibidas) {
  biblioteca = bibliotecaRecibida || {};
  covers = coversRecibidas || {};
  renderAlbums();
  navigateTo('screen-albums');
};

function renderAlbums() {
  const container = document.getElementById('albums-container');
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
  document.getElementById('album-header').innerText = album;
  
  const container = document.getElementById('songs-container');
  container.innerHTML = '';

  listaCancionesActual.forEach((song, idx) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerText = song.nombre || song;
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
  const nombre = song.nombre || song;
  const url = song.archivo || song.path || song;

  document.getElementById('player-song-title').innerText = nombre;
  document.getElementById('player-album-info').innerText = albumActual;

  const playerCover = document.getElementById('player-cover');
  const playerCoverIcon = document.getElementById('player-cover-icon');
  const claveAlbum = albumActual.toLowerCase();

  if (covers[claveAlbum]) {
    playerCover.style.backgroundImage = `url('${covers[claveAlbum]}')`;
    playerCoverIcon.style.display = 'none';
  } else {
    playerCover.style.backgroundImage = 'none';
    playerCoverIcon.style.display = 'block';
  }
  
  audioElement.src = url;
  audioElement.play();
  document.getElementById('btn-play-pause').innerText = '⏸';

  navigateTo('screen-player');
}

function togglePlayMusic() {
  if (audioElement.paused) {
    audioElement.play();
    document.getElementById('btn-play-pause').innerText = '⏸';
  } else {
    audioElement.pause();
    document.getElementById('btn-play-pause').innerText = '▶';
  }
}

function detenerMusica() {
  audioElement.pause();
  audioElement.currentTime = 0;
  document.getElementById('btn-play-pause').innerText = '▶';
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

audioElement.addEventListener('ended', nextSong);

audioElement.addEventListener('timeupdate', () => {
  if (!isNaN(audioElement.duration)) {
    seekBar.max = Math.floor(audioElement.duration);
    seekBar.value = Math.floor(audioElement.currentTime);
    document.getElementById('current-time').innerText = formatTime(audioElement.currentTime);
    document.getElementById('total-time').innerText = formatTime(audioElement.duration);
  }
});

seekBar.addEventListener('input', () => { audioElement.currentTime = seekBar.value; });

/* RADIO */
window.addEventListener('DOMContentLoaded', () => {
  emisorasRadio = Array.from(document.querySelectorAll('#radio-buttons-container .boton-canal'));
});

function playRadio(elemento, url) {
  marcarBotonActivo(elemento);
  if (elemento) indiceRadioActual = emisorasRadio.indexOf(elemento);
  radioAudioElement.src = url;
  radioAudioElement.play();
  document.getElementById('btn-radio-play').innerText = '⏸';
}

function togglePlayRadio() {
  if (radioAudioElement.paused) {
    radioAudioElement.play();
    document.getElementById('btn-radio-play').innerText = '⏸';
  } else {
    radioAudioElement.pause();
    document.getElementById('btn-radio-play').innerText = '▶';
  }
}

function prevRadio() {
  if (emisorasRadio.length === 0) return;
  indiceRadioActual = (indiceRadioActual - 1 + emisorasRadio.length) % emisorasRadio.length;
  emisorasRadio[indiceRadioActual].click();
}

function nextRadio() {
  if (emisorasRadio.length === 0) return;
  indiceRadioActual = (indiceRadioActual + 1) % emisorasRadio.length;
  emisorasRadio[indiceRadioActual].click();
}

radioAudioElement.addEventListener('timeupdate', () => {
  if (!isNaN(radioAudioElement.duration) && isFinite(radioAudioElement.duration)) {
    radioSeekBar.max = Math.floor(radioAudioElement.duration);
    radioSeekBar.value = Math.floor(radioAudioElement.currentTime);
    document.getElementById('radio-total-time').innerText = formatTime(radioAudioElement.duration);
  } else {
    radioSeekBar.max = 100;
    radioSeekBar.value = 100;
    document.getElementById('radio-total-time').innerText = 'LIVE';
  }
  document.getElementById('radio-current-time').innerText = formatTime(radioAudioElement.currentTime);
});

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  let min = Math.floor(seconds / 60);
  let sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
