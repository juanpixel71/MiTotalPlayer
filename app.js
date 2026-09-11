/* ============================================================
   MITOTALPLAYER - APPLICATION ENGINE
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GESTIÓN DE NAVEGACIÓN ENTRE PANTALLAS ---
    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-btn, .nav-item');

    function switchScreen(targetId) {
        screens.forEach(screen => {
            if (screen.id === targetId || screen.dataset.screen === targetId) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });

        navButtons.forEach(btn => {
            if (btn.dataset.target === targetId || btn.dataset.screen === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target || btn.dataset.screen;
            if (target) switchScreen(target);
        });
    });

    // Botones de "< VOLVER" en TV/News
    const backBtns = document.querySelectorAll('.btn-back, .back-btn');
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const backTo = btn.dataset.back || 'screen-tv';
            switchScreen(backTo);
        });
    });

    // --- 2. REPRODUCTOR DE MÚSICA & LISTA DE CANCIONES ---
    const audioPlayer = document.getElementById('audio-player') || document.querySelector('audio');
    const playBtn = document.getElementById('play-btn') || document.getElementById('play-pause-btn');
    const songItems = document.querySelectorAll('.song-item, .song-card, .track-item');
    
    const trackTitle = document.getElementById('player-song-title') || document.querySelector('.track-title');
    const trackArtist = document.getElementById('player-song-artist') || document.querySelector('.track-artist');
    const trackCover = document.getElementById('player-cover') || document.querySelector('.album-art');
    const progressBar = document.getElementById('progress-bar-fill') || document.querySelector('.progress-bar-fill');
    const progressContainer = document.getElementById('progress-container') || document.querySelector('.progress-bar-container');

    // SOLUCIÓN PUNTO 4: Al hacer clic en una canción, se carga, cambia de pantalla Y REPRODUCE
    songItems.forEach(item => {
        item.addEventListener('click', () => {
            const src = item.dataset.src || item.getAttribute('data-src');
            const title = item.dataset.title || item.querySelector('.title, h4')?.textContent;
            const artist = item.dataset.artist || item.querySelector('.artist, p')?.textContent;
            const cover = item.dataset.cover || item.querySelector('img')?.src;

            // Actualizar interfaz del reproductor
            if (trackTitle && title) trackTitle.textContent = title;
            if (trackArtist && artist) trackArtist.textContent = artist;
            if (trackCover && cover) trackCover.src = cover;

            if (audioPlayer && src) {
                audioPlayer.src = src;
                audioPlayer.load();

                // 1. Cambiar a pantalla de reproductor de música
                switchScreen('screen-music');

                // 2. FORZAR REPRODUCCIÓN INMEDIATA
                const playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (playBtn) playBtn.textContent = '❚❚';
                    }).catch(err => {
                        console.warn("Autoplay bloqueado o archivo inaccesible:", err);
                    });
                }
            }
        });
    });

    // Play / Pausa Manual
    if (playBtn && audioPlayer) {
        playBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playBtn.textContent = '❚❚';
            } else {
                audioPlayer.pause();
                playBtn.textContent = '▶';
            }
        });
    }

    // Progreso de pista
    if (audioPlayer && progressBar) {
        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressBar.style.width = `${pct}%`;
            }
        });
    }

    if (progressContainer && audioPlayer) {
        progressContainer.addEventListener('click', (e) => {
            const width = progressContainer.clientWidth;
            const clickX = e.offsetX;
            if (audioPlayer.duration) {
                audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
            }
        });
    }

    // --- 3. REPRODUCTOR DE RADIO ONLINE ---
    const radioPlayer = document.getElementById('radio-player');
    const radioPlayBtn = document.getElementById('radio-play-btn');

    if (radioPlayBtn && radioPlayer) {
        radioPlayBtn.addEventListener('click', () => {
            if (radioPlayer.paused) {
                // Pausar música si estuviera sonando
                if (audioPlayer) audioPlayer.pause();
                radioPlayer.play();
                radioPlayBtn.textContent = '❚❚';
            } else {
                radioPlayer.pause();
                radioPlayBtn.textContent = '▶';
            }
        });
    }
});
