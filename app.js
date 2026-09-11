document.addEventListener('DOMContentLoaded', () => {
    // Definición de Pantallas
    const screens = {
        home: document.getElementById('screen-home'),
        tv: document.getElementById('screen-tv'),
        music: document.getElementById('screen-music'),
        radio: document.getElementById('screen-radio')
    };

    // Reproductores
    const tvPlayer = document.getElementById('tv-player');
    const radioPlayer = document.getElementById('radio-player');

    // Función principal para cambiar de pantalla
    function showScreen(targetScreen) {
        Object.values(screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        if (targetScreen) targetScreen.classList.add('active');
    }

    // Botones del HOME
    document.getElementById('btn-nav-tv').addEventListener('click', () => showScreen(screens.tv));
    document.getElementById('btn-nav-music').addEventListener('click', () => showScreen(screens.music));
    document.getElementById('btn-nav-radio').addEventListener('click', () => showScreen(screens.radio));

    // Botones para VOLVER AL HOME
    document.querySelectorAll('.btn-go-home').forEach(btn => {
        btn.addEventListener('click', () => {
            if (tvPlayer) tvPlayer.pause();
            if (radioPlayer) radioPlayer.pause();
            showScreen(screens.home);
        });
    });

    // Reproducción de Canales TV
    document.querySelectorAll('.btn-tv-channel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const streamUrl = e.target.getAttribute('data-url');
            if (tvPlayer && streamUrl) {
                tvPlayer.src = streamUrl;
                tvPlayer.play();
            }
        });
    });

    // Reproducción de Radios
    document.querySelectorAll('.btn-radio-channel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const streamUrl = e.target.getAttribute('data-url');
            if (radioPlayer && streamUrl) {
                radioPlayer.src = streamUrl;
                radioPlayer.play();
            }
        });
    });
});
