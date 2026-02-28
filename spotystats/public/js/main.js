d3.dsvFormat(';');

//Cores dos generos - Paleta otimizada para Visualização de Informação
// Cores únicas, alto contraste, e semanticamente apropriadas
const genreColorsBase = {
    // Pop e variantes - Rosa/Magenta
    'pop': '#FF1493',           // Deep Pink
    'k-pop': '#FF69B4',         // Hot Pink
    'kpop': '#FF69B4',
    'dance pop': '#C71585',     // Medium Violet Red

    // Rock e variantes - Roxo/Violeta
    'rock': '#8B00FF',          // Violet
    'alternative': '#9370DB',    // Medium Purple
    'indie': '#BA55D3',         // Medium Orchid
    'punk': '#DA70D6',          // Orchid

    // Hip Hop/Rap - Laranja/Coral
    'hip hop': '#FF4500',       // Orange Red
    'hip-hop': '#FF4500',
    'rap': '#FF6347',           // Tomato
    'trap': '#FF7F50',          // Coral

    // Electronic/Dance - Ciano/Azul elétrico
    'electronic': '#00CED1',    // Dark Turquoise
    'edm': '#00FFFF',           // Cyan
    'dance': '#1E90FF',         // Dodger Blue
    'house': '#4169E1',         // Royal Blue
    'techno': '#0080FF',        // Light Blue

    // Jazz e Soul - Amarelo/Dourado
    'jazz': '#FFD700',          // Gold
    'soul': '#FFA500',          // Orange
    'funk': '#FF8C00',          // Dark Orange

    // R&B - Azul profundo
    'r&b': '#4682B4',           // Steel Blue
    'rnb': '#4682B4',

    // Latin - Vermelho vibrante
    'latin': '#DC143C',         // Crimson
    'reggaeton': '#FF0000',     // Red
    'salsa': '#B22222',         // Fire Brick

    // Country/Folk - Marrom/Terra
    'country': '#D2691E',       // Chocolate
    'folk': '#A0522D',          // Sienna

    // Classical - Verde claro
    'classical': '#32CD32',     // Lime Green

    // Metal - Cinza escuro
    'metal': '#778899',         // Light Slate Gray
    'heavy metal': '#696969',   // Dim Gray

    // Blues - Azul índigo
    'blues': '#483D8B',         // Dark Slate Blue

    // Reggae - Verde
    'reggae': '#00FF00',        // Lime

    // Outros
    'ambient': '#20B2AA',       // Light Sea Green
    'gospel': '#F0E68C',        // Khaki
    'disco': '#FF00FF'          // Magenta
};

function getGenreColor(genre) {
    if (!genre) return '#888888';

    const normalized = genre.toLowerCase().trim();

    // Procura exata
    if (genreColorsBase[normalized]) {
        return genreColorsBase[normalized];
    }

    // Procura parcial (para subgéneros)
    for (let key in genreColorsBase) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return genreColorsBase[key];
        }
    }

    // Gerar cor única baseada em hash (melhorada para visualização)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Paleta expandida com cores bem distintas
    const distinctColors = [
        '#FF1493', '#8B00FF', '#00CED1', '#FFD700', '#FF4500',
        '#32CD32', '#FF69B4', '#4169E1', '#DC143C', '#9370DB',
        '#00FFFF', '#FF6347', '#BA55D3', '#D2691E', '#4682B4',
        '#FF7F50', '#00FF00', '#483D8B', '#FFA500', '#1E90FF'
    ];

    const colorIndex = Math.abs(hash) % distinctColors.length;
    return distinctColors[colorIndex];
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

        const [songsResponse, tracksResponse] = await Promise.all([
            fetch('datasets/Best Songs on Spotify from 2000-2023.csv'),
            fetch('datasets/matched_tracks.csv')
        ]);

        const csvText = await songsResponse.text();
        const tracksText = await tracksResponse.text();

        const parser = d3.dsvFormat(';');
        const tracksParser = d3.csvParse;

        const rawData = parser.parse(csvText);
        const matchedTracks = tracksParser(tracksText);

        // Create a lookup map for track IDs
        // Key: "artist|song_name" (normalized) -> Value: track_id
        const trackIdMap = new Map();
        matchedTracks.forEach(t => {
            if (t.track_id && t.artist && t.title) {
                const key = `${t.artist.toLowerCase().trim()}|${t.title.toLowerCase().trim()}`;
                trackIdMap.set(key, t.track_id);
            }
        });

        appState.data = rawData.map(d => {
            const artist = d.artist || 'Unknown';
            const title = d.title || 'Unknown';
            const lookupKey = `${artist.toLowerCase().trim()}|${title.toLowerCase().trim()}`;

            return {
                id: trackIdMap.get(lookupKey) || Math.random().toString(), // Use real ID if found
                name: title,
                artist: artist,
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
                duration_ms: (+d.duration || 200) * 1000,
                hasRealId: trackIdMap.has(lookupKey) // Flag to know if we have a real ID
            };
        });

        // Filtrar dados inválidos
        appState.data = appState.data.filter(d =>
            d.year >= 2000 &&
            d.year <= 2023 &&
            d.danceability >= 0 && d.danceability <= 1 &&
            d.energy >= 0 && d.energy <= 1 &&
            d.genre && d.genre !== ''
        );

        appState.filteredData = appState.data;
        appState.yearRange = [2000, 2023];

        // Inicializar visualizações
        initializeFilters();
        createScatterplot();
        createTimeline();
        createVariablesTimeline();
        createRadarChart();
        createArtistSongsView(null);

    } catch (error) {
        console.error('Error loading data:', error);
        showModal('Error loading data: ' + error.message);
    }
}

// Atualizar todas as visualizações quando os filtros mudam
function updateAllVisualizations() {
    appState.filteredData = appState.data.filter(d => {
        const genreMatch = appState.selectedGenres.length === 0 ||
            appState.selectedGenres.some(g => d.genre === g.toLowerCase());
        const popularityMatch = d.popularity >= appState.minPopularity;
        const yearMatch = d.year >= appState.yearRange[0] && d.year <= appState.yearRange[1];

        return genreMatch && popularityMatch && yearMatch;
    });

    updateScatterplot();
    updateTimeline();
    updateVariablesTimeline();

}

loadData();
