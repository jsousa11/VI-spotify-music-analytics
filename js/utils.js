// Obter géneros únicos (limpar e normalizar)
function getUniqueGenres(data) {
    const genres = new Set();
    
    data.forEach(d => {
        if (!d.genre || d.genre === 'unknown' || d.genre === '' || d.genre.length < 2) {
            return; // Skip inválidos
        }
        
        // Limpar e normalizar
        const cleanGenre = d.genre.toLowerCase().trim();
        
        genres.add(cleanGenre);
    });
    
    const uniqueGenres = [...genres].sort();

    return uniqueGenres;
}

// Obter artistas únicos (top N por popularidade)
function getTopArtists(data, n = 100) {
    const artistPopularity = d3.rollup(
        data,
        v => d3.mean(v, d => d.popularity),
        d => d.artist
    );
    
    return [...artistPopularity.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(d => d[0]);
}

// Agregar dados por ano e género (para timeline)
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
