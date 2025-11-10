d3.dsvFormat(';');

//Cores dos generos
const genreColorsBase = {
    'pop': '#E91E63',
    'rock': '#9C27B0',
    'hip hop': '#FF5722',
    'hip-hop': '#FF5722',
    'rap': '#FF5722',
    'k-pop': '#00BCD4',
    'kpop': '#00BCD4',
    'electronic': '#00BCD4',
    'edm': '#00BCD4',
    'dance': '#00BCD4',
    'jazz': '#FFC107',
    'classical': '#8BC34A',
    'country': '#FF9800',
    'r&b': '#3F51B5',
    'rnb': '#3F51B5',
    'latin': '#F44336',
    'reggaeton': '#F44336',
    'metal': '#607D8B',
    'indie': '#CDDC39',
    'folk': '#795548',
    'soul': '#9C27B0',
    'blues': '#3F51B5',
    'punk': '#E91E63',
    'alternative': '#9C27B0',
    'trap': '#FF5722',
    'house': '#00BCD4'
};

function getGenreColor(genre) {
    if (!genre) return '#888';
    
    const normalized = genre.toLowerCase().trim();
    
    if (genreColorsBase[normalized]) {
        return genreColorsBase[normalized];
    }
    
    for (let key in genreColorsBase) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return genreColorsBase[key];
        }
    }
    
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 55%)`;
}

const genreColors = new Proxy({}, {
    get: (target, prop) => getGenreColor(prop)
});

const appState = {
    data: [],
    filteredData: [],
    aggregatedByYear: [],
    aggregatedByGenre: [],
    selectedGenres: [],
    selectedArtists: [],
    minPopularity: 0,
    yearRange: [2000, 2023]
};

function parseBestSongs(d) {
    return {
        id: Math.random().toString(),
        name: d.title || 'Unknown',
        artist: d.artist || 'Unknown',
        year: +d.year || 2000,
        genre: (d['top genre'] || 'pop').toLowerCase().trim(),
        popularity: +d.popularity || 50,
        // Valores em % (dividir por 100)
        danceability: +d['danceability '] / 100 || 0.5,
        energy: +d.energy / 100 || 0.5,
        acousticness: +d.acousticness / 100 || 0.5,
        valence: +d.valence / 100 || 0.5,
        speechiness: +d['speechiness '] / 100 || 0,
        instrumentalness: 0,
        loudness: +d.dB || -10,
        tempo: +d.bpm || 120,
        liveness: +d.liveness / 100 || 0.1,
        duration_ms: +d.duration * 1000 || 200000
    };
}

function parseMainData(d) {
    let genre = 'pop';
    try {
        if (d.artists && d.artists.includes('[')) {
            const artistArray = JSON.parse(d.artists.replace(/'/g, '"'));
        }
    } catch (e) {

    }
    
    return {
        id: d.id || Math.random().toString(),
        name: d.name || 'Unknown',
        artist: d.artists ? d.artists.replace(/[\[\]']/g, '').split(',')[0] : 'Unknown',
        year: +d.year || 1921,
        genre: genre,
        popularity: +d.popularity || 50,
        danceability: +d.danceability || 0.5,
        energy: +d.energy || 0.5,
        acousticness: +d.acousticness || 0.5,
        valence: +d.valence || 0.5,
        speechiness: +d.speechiness || 0,
        instrumentalness: +d.instrumentalness || 0,
        loudness: +d.loudness || -10,
        tempo: +d.tempo || 120,
        liveness: +d.liveness || 0.1,
        duration_ms: +d.duration_ms || 200000
    };
}

async function loadData() {
    try {
        
        const response = await fetch('data/Best Songs on Spotify from 2000-2023.csv');
        const csvText = await response.text();
                
        const parser = d3.dsvFormat(';');
        const rawData = parser.parse(csvText);
        
        appState.data = rawData.map(d => ({
            id: Math.random().toString(),
            name: d.title || 'Unknown',
            artist: d.artist || 'Unknown',
            year: +d.year || 2000,
            genre: (d['top genre'] || 'pop').toLowerCase().trim(),
            popularity: +d.popularity || 50,
            danceability: (+d['danceability '] || 50) / 100,
            energy: (+d.energy || 50) / 100,
            acousticness: (+d.acousticness || 50) / 100,
            valence: (+d.valence || 50) / 100,
            speechiness: (+d['speechiness '] || 5) / 100,
            instrumentalness: 0,
            loudness: +d.dB || -10,
            tempo: +d.bpm || 120,
            liveness: (+d.liveness || 10) / 100,
            duration_ms: (+d.duration || 200) * 1000
        }));
        
        // Filtrar dados inválidos
        appState.data = appState.data.filter(d => 
            d.year >= 2000 && 
            d.year <= 2023 &&
            d.danceability >= 0 && d.danceability <= 1 &&
            d.energy >= 0 && d.energy <= 1 &&
            d.genre && d.genre !== '' && d.genre !== 'pop'
        );
        
        appState.filteredData = appState.data;
        appState.yearRange = [2000, 2023];
        
        // Inicializar visualizações
        initializeFilters();
        createScatterplot();
        createTimeline();
        createRadarChart();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Erro ao carregar dados: ' + error.message);
    }
}

// Atualizar todas as visualizações quando os filtros mudam
function updateAllVisualizations() {
    appState.filteredData = appState.data.filter(d => {
        const genreMatch = appState.selectedGenres.length === 0 || 
                          appState.selectedGenres.some(g => d.genre.includes(g.toLowerCase()));
        const popularityMatch = d.popularity >= appState.minPopularity;
        const yearMatch = d.year >= appState.yearRange[0] && d.year <= appState.yearRange[1];
        
        return genreMatch && popularityMatch && yearMatch;
    });
    
    updateScatterplot();
    updateTimeline();
}

loadData();
