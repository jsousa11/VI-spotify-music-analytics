let selectedArtistForSongs = null;

// Initialize the Artists Page
// Initialize the Artists Page
function initArtistsPage() {
    createArtistSongsView(null);
}

function showArtistDetail(artistName) {
    // ... (This function seems redundant now as showArtistDetails handles it, but let's keep it compatible if needed or just redirect)
    showArtistDetails(artistName);
}

function hideArtistDetail() {
    selectedArtistForSongs = null; // Clear selection
    createArtistSongsView(null);
}

// Initialize the artist songs view (this function now handles the artist list and search)
function createArtistSongsView(selectedArtist) {
    // Ensure the correct container is visible
    d3.select('.artist-selection-view').classed('hidden', false);
    d3.select('#artist-detail-view').classed('hidden', true);

    const container = d3.select('#artist-songs-container'); // Use the existing container for the list
    container.html(''); // Clear previous content

    // --- Search Bar Section ---
    const searchContainer = container.append('div')
        .attr('class', 'artist-search-container')
        .style('margin-bottom', '24px')
        .style('display', 'flex')
        .style('gap', '12px')
        .style('align-items', 'center');

    const searchInput = searchContainer.append('input')
        .attr('type', 'text')
        .attr('placeholder', 'Search for an artist...')
        .attr('class', 'artist-search-input')
        .style('padding', '12px')
        .style('border-radius', '24px')
        .style('border', '1px solid #404040')
        .style('background', '#282828')
        .style('color', '#fff')
        .style('flex-grow', '1')
        .style('font-size', '16px');

    // --- Sorting Toggle ---
    let sortBy = 'alpha'; // 'alpha' or 'count'

    const sortContainer = searchContainer.append('div')
        .style('display', 'flex')
        .style('background', '#282828')
        .style('border', '1px solid #404040')
        .style('border-radius', '24px')
        .style('padding', '4px')
        .style('height', '46px')
        .style('align-items', 'center');

    const sortAlphaBtn = sortContainer.append('button')
        .attr('class', 'sort-btn active')
        .style('background', '#1DB954')
        .style('color', '#fff')
        .style('border', 'none')
        .style('border-radius', '20px')
        .style('padding', '8px 16px')
        .style('cursor', 'pointer')
        .style('font-weight', 'bold')
        .style('transition', 'all 0.2s')
        .text('A')
        .on('click', function () {
            if (sortBy !== 'alpha') {
                sortBy = 'alpha';
                updateSortButtons();
                renderArtistCards(searchInput.property('value'));
            }
        });

    const sortCountBtn = sortContainer.append('button')
        .attr('class', 'sort-btn')
        .style('background', 'transparent')
        .style('color', '#B3B3B3')
        .style('border', 'none')
        .style('border-radius', '20px')
        .style('padding', '8px 16px')
        .style('cursor', 'pointer')
        .style('font-weight', 'bold')
        .style('transition', 'all 0.2s')
        .text('#')
        .on('click', function () {
            if (sortBy !== 'count') {
                sortBy = 'count';
                updateSortButtons();
                renderArtistCards(searchInput.property('value'));
            }
        });

    function updateSortButtons() {
        if (sortBy === 'alpha') {
            sortAlphaBtn.style('background', '#1DB954').style('color', '#fff');
            sortCountBtn.style('background', 'transparent').style('color', '#B3B3B3');
        } else {
            sortAlphaBtn.style('background', 'transparent').style('color', '#B3B3B3');
            sortCountBtn.style('background', '#1DB954').style('color', '#fff');
        }
    }

    // --- Artist List Container ---
    const artistsListContainer = container.append('div')
        .attr('class', 'artists-list-grid');

    // Get all unique artists from FULL data
    // We'll sort them inside renderArtistCards
    const allArtists = Array.from(new Set(appState.data.map(d => d.artist)));

    // Pre-calculate song counts for sorting efficiency
    const artistSongCounts = new Map();
    allArtists.forEach(artist => {
        artistSongCounts.set(artist, appState.data.filter(d => d.artist === artist).length);
    });

    // Function to render artist cards
    function renderArtistCards(filterText = '') {
        artistsListContainer.html(''); // Clear list

        let filteredArtists = allArtists.filter(artist =>
            artist.toLowerCase().includes(filterText.toLowerCase())
        );

        // Sort based on current mode
        if (sortBy === 'alpha') {
            filteredArtists.sort((a, b) => a.localeCompare(b));
        } else {
            filteredArtists.sort((a, b) => artistSongCounts.get(b) - artistSongCounts.get(a));
        }

        if (filteredArtists.length === 0) {
            artistsListContainer.append('p')
                .style('color', '#b3b3b3')
                .style('grid-column', '1 / -1')
                .style('text-align', 'center')
                .text('No artists found matching your search.');
            return;
        }

        filteredArtists.forEach(artist => {
            const card = artistsListContainer.append('div')
                .attr('class', 'artist-card')
                .on('click', () => showArtistDetails(artist));

            // Placeholder image (since we don't have real artist images)
            // We can use a colored circle with initials
            const initials = artist.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            card.append('div')
                .style('width', '80px')
                .style('height', '80px')
                .style('border-radius', '50%')
                .style('background', '#333')
                .style('color', '#1DB954')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'center')
                .style('font-size', '24px')
                .style('font-weight', 'bold')
                .style('margin', '0 auto 16px')
                .text(initials);

            card.append('h4')
                .text(artist);

            // Count songs for this artist in FULL data
            const songCount = artistSongCounts.get(artist);

            card.append('p')
                .text(`${songCount} songs`);
        });
    }

    // Initial render
    renderArtistCards();

    // Search input event listener
    searchInput.on('input', function () {
        renderArtistCards(this.value);
    });

    // If an artist is selected (from another page), show details immediately
    if (selectedArtist) {
        showArtistDetails(selectedArtist);
    }
}

function showArtistDetails(artist) {
    selectedArtistForSongs = artist; // Update global selected artist

    // Hide the artist selection view and show the detail view
    d3.select('.artist-selection-view').classed('hidden', true);
    d3.select('#artist-detail-view').classed('hidden', false);

    const container = d3.select('#artist-detail-view-content'); // Use the content div within the detail view
    container.html(''); // Clear list view

    // Back button
    const backBtn = container.append('button')
        .attr('class', 'btn-secondary')
        .style('margin-bottom', '20px')
        .html('← Back to Artists')
        .on('click', () => hideArtistDetail()); // Call hideArtistDetail to go back to the list

    // Header Container
    const headerContainer = container.append('div')
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');

    // Get artist songs from FULL data
    const songs = appState.data
        .filter(d => d.artist === artist);

    // Artist Name
    headerContainer.append('h2')
        .attr('id', 'selected-artist-name')
        .style('margin', '0')
        .text(`${artist} - ${songs.length} songs`);

    // Sorting Control
    const sortContainer = headerContainer.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '8px');

    sortContainer.append('span')
        .style('color', '#B3B3B3')
        .style('font-size', '14px')
        .text('Sort by:');

    const sortSelect = sortContainer.append('select')
        .style('background', '#282828')
        .style('color', '#fff')
        .style('border', '1px solid #404040')
        .style('border-radius', '4px')
        .style('padding', '6px 12px')
        .style('cursor', 'pointer')
        .on('change', function () {
            renderSongList(this.value);
        });

    const sortOptions = [
        { value: 'popularity', label: 'Popularity' },
        { value: 'energy', label: 'Energy' },
        { value: 'danceability', label: 'Dance' },
        { value: 'valence', label: 'Mood' },
        { value: 'acousticness', label: 'Acoustic' },
        { value: 'name', label: 'Alphabetical' }
    ];

    sortOptions.forEach(opt => {
        sortSelect.append('option')
            .attr('value', opt.value)
            .text(opt.label);
    });

    // Layout Grid
    const contentGrid = container.append('div')
        .attr('class', 'artist-content-grid');

    // Left: Song List
    const songList = contentGrid.append('div')
        .attr('class', 'song-list');

    // Right: Spotify Preview
    const spotifyPreview = contentGrid.append('div')
        .attr('class', 'spotify-preview');

    spotifyPreview.append('h3').text('Preview');
    spotifyPreview.append('div')
        .attr('id', 'spotify-iframe-container')
        .html('<p class="placeholder-text">Select a song to preview</p>');



    // Function to render sorted song list
    function renderSongList(sortBy = 'popularity') {
        songList.html(''); // Clear list

        // Sort songs
        const sortedSongs = [...songs].sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else {
                // For metrics, sort descending
                return b[sortBy] - a[sortBy];
            }
        });

        sortedSongs.forEach(song => {
            const item = songList.append('div')
                .attr('class', 'song-item')
                .on('click', function () {
                    // Highlight active song
                    d3.selectAll('.song-item').classed('active', false);
                    d3.select(this).classed('active', true);
                    updateSpotifyIframe(song);
                });

            const info = item.append('div').attr('class', 'song-info');
            info.append('div').attr('class', 'song-title').text(song.name);
            info.append('div').attr('class', 'song-meta')
                .text(`${song.year} • Popularity: ${song.popularity}`);

            // Enhanced Metrics Visualization
            const metricsRow = item.append('div')
                .style('display', 'flex')
                .style('gap', '12px')
                .style('margin-top', '8px');

            const metrics = [
                { key: 'energy', label: 'Energy', color: '#FFD700' },       // Gold
                { key: 'danceability', label: 'Dance', color: '#FF69B4' },  // Hot Pink
                { key: 'valence', label: 'Mood', color: '#00CED1' },        // Dark Turquoise
                { key: 'acousticness', label: 'Acoustic', color: '#32CD32' } // Lime Green
            ];

            metrics.forEach(m => {
                const mContainer = metricsRow.append('div')
                    .style('flex', '1')
                    .style('display', 'flex')
                    .style('flex-direction', 'column')
                    .style('gap', '2px');

                // Label and Value
                const header = mContainer.append('div')
                    .style('display', 'flex')
                    .style('justify-content', 'space-between')
                    .style('font-size', '10px')
                    .style('color', '#b3b3b3');

                header.append('span').text(m.label);
                header.append('span').text(`${(song[m.key] * 100).toFixed(0)}%`);

                // Bar Background
                const barBg = mContainer.append('div')
                    .style('height', '6px')
                    .style('background', '#404040')
                    .style('border-radius', '3px')
                    .style('overflow', 'hidden');

                // Bar Fill
                barBg.append('div')
                    .style('height', '100%')
                    .style('width', `${song[m.key] * 100}%`)
                    .style('background-color', m.color);
            });
        });
    }

    // Initial render (default: popularity)
    renderSongList('popularity');
}

function getMetricColor(metric) {
    switch (metric) {
        case 'energy': return '#FFC107'; // Yellow
        case 'danceability': return '#00BCD4'; // Cyan
        case 'valence': return '#E91E63'; // Pink
        default: return '#1DB954';
    }
}

function updateSpotifyIframe(song) {
    const container = d3.select('#spotify-iframe-container');
    container.html('');

    // Check if we have a real Spotify Track ID (loaded from matched_tracks.csv)
    if (song.hasRealId && song.id != "NOT_FOUND") {
        container.append('iframe')
            .attr('style', 'border-radius:12px')
            .attr('src', `https://open.spotify.com/embed/track/${song.id}?utm_source=generator`)
            .attr('width', '100%')
            .attr('height', '2000')
            .attr('frameBorder', '0')
            .attr('allowfullscreen', '')
            .attr('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture')
            .attr('loading', 'lazy');
    } else {
        // Fallback: Search on Spotify
        container.append('div')
            .style('padding', '30px')
            .style('text-align', 'center')
            .style('color', '#B3B3B3')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('align-items', 'center')
            .style('gap', '16px')
            .html(`
                <div style="font-size: 48px; margin-bottom: 8px;">🎵</div>
                <p style="margin: 0; font-size: 16px; color: #EDEDED;">${song.name}</p>
                <p style="margin: 0; font-size: 14px;">${song.artist}</p>
                <p style="margin: 0; font-size: 12px; color: #888;">(Preview unavailable for this track)</p>
                <a href="https://open.spotify.com/search/${encodeURIComponent(song.name + ' ' + song.artist)}" 
                   target="_blank" 
                   class="btn-secondary"
                   style="display: inline-block; margin-top: 8px; text-decoration: none; border-color: #1DB954; color: #1DB954;">
                   Listen on Spotify ↗
                </a>
            `);
    }
}

// Export functions to be used globally
window.initArtistsPage = initArtistsPage;
window.updateArtistSongsView = () => {
    // Re-render if in detail view
    if (selectedArtistForSongs) {
        createArtistSongsView(selectedArtistForSongs);
    } else {
        initArtistsPage();
    }
};
