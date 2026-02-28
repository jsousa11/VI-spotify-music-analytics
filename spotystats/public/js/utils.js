function getUniqueGenres(data) {
    const genres = new Set();

    data.forEach(d => {
        if (!d.genre || d.genre === 'unknown' || d.genre === '' || d.genre.length < 2) {
            return;
        }
        const cleanGenre = d.genre.toLowerCase().trim();

        genres.add(cleanGenre);
    });

    const uniqueGenres = [...genres].sort();

    return uniqueGenres;
}

// Obter artistas únicos
function getTopArtists(data, n = 100) {
    const artistPopularity = d3.rollup(
        data,
        v => d3.mean(v, d => d.popularity),
        d => d.artist
    );

    return [...artistPopularity.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(d => d[0])
        .sort((a, b) => a.localeCompare(b));
}

// Agregar dados por ano e género
function aggregateByYearAndGenre(data) {
    const nested = d3.rollups(
        data,
        v => v.length,
        d => d.year,
        d => d.genre
    );

    return nested.map(([year, genres]) => ({
        year: year,
        genres: Object.fromEntries(genres)
    }));
}

// Formatar números
function formatNumber(num, decimals = 2) {
    return num.toFixed(decimals);
}

// Normalizar valores para radar chart
function normalizeValue(value, min, max) {
    return (value - min) / (max - min);
}

// Show custom modal
function showModal(message) {
    const modal = document.getElementById('custom-modal');
    const modalMessage = document.getElementById('modal-message');
    const okBtn = document.getElementById('modal-ok-btn');
    const closeBtn = document.querySelector('.modal-close');

    modalMessage.textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('visible');

    const closeModal = () => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    okBtn.onclick = closeModal;
    closeBtn.onclick = closeModal;

    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
}
