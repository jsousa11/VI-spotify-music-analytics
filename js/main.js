// Configurar d3 para aceitar `;` como delimitador
d3.dsvFormat(';'); // Para "Best Songs 2000-2023.csv"

// Mapeamento de cores base
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

// Função para obter cor de género (com fallback inteligente)
function getGenreColor(genre) {
    if (!genre) return '#888';
    
    const normalized = genre.toLowerCase().trim();
    
    // 1. Tentar match exato
    if (genreColorsBase[normalized]) {
        return genreColorsBase[normalized];
    }
    
    // 2. Tentar match parcial (ex: "dance pop" → "pop")
    for (let key in genreColorsBase) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return genreColorsBase[key];
        }
    }
    
    // 3. Hash de cor baseado no nome (consistente)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 55%)`;
}

// Substituir genreColors global
const genreColors = new Proxy({}, {
    get: (target, prop) => getGenreColor(prop)
});

// Estado global da aplicação
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

// Parser para "Best Songs 2000-2023" (separador: ;)
function parseBestSongs(d) {
    return {
        id: Math.random().toString(),
        name: d.title || 'Unknown',
        artist: d.artist || 'Unknown',
        year: +d.year || 2000,
        genre: (d['top genre'] || 'pop').toLowerCase().trim(),
        popularity: +d.popularity || 50,
        // Valores em % (dividir por 100)
        danceability: +d['danceability '] / 100 || 0.5, // Nota: tem espaço!
        energy: +d.energy / 100 || 0.5,
        acousticness: +d.acousticness / 100 || 0.5,
        valence: +d.valence / 100 || 0.5,
        speechiness: +d['speechiness '] / 100 || 0, // Nota: tem espaço!
        instrumentalness: 0, // Não existe neste CSV
        loudness: +d.dB || -10,
        tempo: +d.bpm || 120,
        liveness: +d.liveness / 100 || 0.1,
        duration_ms: +d.duration * 1000 || 200000
    };
}

// Parser para "data.csv" (separador: ,)
function parseMainData(d) {
    // Extrair primeiro género do array JSON
    let genre = 'pop';
    try {
        if (d.artists && d.artists.includes('[')) {
            // É um array JSON, mas vamos usar o primeiro artista
            const artistArray = JSON.parse(d.artists.replace(/'/g, '"'));
            // Para genre, não existe neste formato, usar default
        }
    } catch (e) {
        // Ignorar erros de parse
    }
    
    return {
        id: d.id || Math.random().toString(),
        name: d.name || 'Unknown',
        artist: d.artists ? d.artists.replace(/[\[\]']/g, '').split(',')[0] : 'Unknown',
        year: +d.year || 1921,
        genre: genre, // Este CSV não tem genre direto
        popularity: +d.popularity || 50,
        // Valores já normalizados (0–1)
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

// Carregar TODOS os datasets
async function loadData() {
    try {
        console.log('📥 Loading datasets...');
        
        // FETCH manual do CSV e parsear com delimitador ;
        const response = await fetch('data/Best Songs on Spotify from 2000-2023.csv');
        const csvText = await response.text();
        
        console.log('📄 First 200 chars of CSV:', csvText.substring(0, 200));
        
        // IMPORTANTE: usar d3.dsvFormat(';') para ponto e vírgula
        const parser = d3.dsvFormat(';');
        const rawData = parser.parse(csvText);
        
        console.log('🔍 First raw row:', rawData[0]);
        console.log('🔍 Columns:', Object.keys(rawData[0]));
        
        // Parse manual dos dados
        appState.data = rawData.map(d => ({
            id: Math.random().toString(),
            name: d.title || 'Unknown',
            artist: d.artist || 'Unknown',
            year: +d.year || 2000,
            genre: (d['top genre'] || 'pop').toLowerCase().trim(),
            popularity: +d.popularity || 50,
            // IMPORTANTE: dividir por 100 (valores em %)
            danceability: (+d['danceability '] || 50) / 100, // Nota: tem espaço!
            energy: (+d.energy || 50) / 100,
            acousticness: (+d.acousticness || 50) / 100,
            valence: (+d.valence || 50) / 100,
            speechiness: (+d['speechiness '] || 5) / 100, // Nota: tem espaço!
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
        
        console.log(`✅ Loaded ${appState.data.length} tracks (2000-2023)`);
        console.log(`🎵 Sample track:`, appState.data[0]);
        console.log(`🎵 Sample genres:`, appState.data.slice(0, 10).map(d => d.genre));
        console.log(`🎵 Unique genres:`, [...new Set(appState.data.map(d => d.genre))].slice(0, 30));
        
        // Inicializar visualizações
        initializeFilters();
        createScatterplot();
        createTimeline();
        createRadarChart();
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
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
    
    console.log(`🔄 Filtered: ${appState.filteredData.length} tracks`);
    
    updateScatterplot();
    updateTimeline();
    // Radar não precisa atualizar automaticamente
}

// Iniciar aplicação
loadData();
