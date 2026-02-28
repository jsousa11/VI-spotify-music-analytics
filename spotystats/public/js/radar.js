let radarSvg, radarScale, radarAngleSlice;
let selectedArtistsForRadar = [];

function createRadarChart() {
    const container = document.getElementById('radar-chart');
    const containerRect = container.getBoundingClientRect();

    // Responsive dimensions
    const width = containerRect.width || 710;
    const height = 500; // Fixed smaller height as requested
    const margin = { top: 50, right: 80, bottom: 50, left: 80 };
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

    d3.select('#radar-chart').selectAll('*').remove();
    d3.select('#artist-select').selectAll('*').remove();

    const artistSelect = d3.select('#artist-select');

    const headerContainer = artistSelect.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '12px')
        .style('margin-bottom', '12px');

    // Título da seção
    headerContainer.append('label')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('color', '#1DB954')
        .style('white-space', 'nowrap')
        .text('Select artists to compare (max 4):');

    // Container para os chips selecionados
    headerContainer.append('div')
        .attr('id', 'artist-chips')
        .attr('class', 'selected-artists-chips')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '8px')
        .style('min-height', '0')
        .style('padding', '0')
        .style('background', 'transparent')
        .style('border-radius', '8px');

    // Container de pesquisa
    const searchContainer = artistSelect.append('div')
        .style('position', 'relative')
        .style('margin-bottom', '12px');

    // Input de pesquisa
    const searchInput = searchContainer.append('input')
        .attr('type', 'text')
        .attr('id', 'artist-search-input')
        .attr('placeholder', 'Search and add artist...')
        .style('width', '100%')
        .style('padding', '12px')
        .style('background', '#2A2A2A')
        .style('border', '2px solid #3A3A3A')
        .style('color', '#EDEDED')
        .style('border-radius', '8px')
        .style('font-size', '14px')
        .style('transition', 'all 0.3s ease');

    // Dropdown de resultados
    const resultsDropdown = searchContainer.append('div')
        .attr('id', 'artist-search-results')
        .style('position', 'absolute')
        .style('top', '100%')
        .style('left', '0')
        .style('right', '0')
        .style('max-height', '300px')
        .style('overflow-y', 'auto')
        .style('background', '#2A2A2A')
        .style('border', '2px solid #1DB954')
        .style('border-radius', '8px')
        .style('margin-top', '4px')
        .style('display', 'none')
        .style('z-index', '1000')
        .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.5)');

    // Get ALL unique artists sorted alphabetically
    const allArtists = Array.from(new Set(appState.data.map(d => d.artist))).sort();

    // Função para renderizar a lista de artistas
    function renderArtistList(artists) {
        resultsDropdown.selectAll('*').remove();

        // Limit rendering to first 100 to prevent lag if list is huge
        const displayArtists = artists.slice(0, 100);

        displayArtists.forEach(artist => {
            const isSelected = selectedArtistsForRadar.includes(artist);

            const item = resultsDropdown.append('div')
                .style('padding', '10px 12px')
                .style('cursor', isSelected ? 'not-allowed' : 'pointer')
                .style('transition', 'background 0.2s ease')
                .style('color', isSelected ? '#666' : '#EDEDED')
                .style('font-size', '14px')
                .style('border-bottom', '1px solid #3A3A3A')
                .text(artist)
                .on('mouseover', function () {
                    if (!isSelected) {
                        d3.select(this).style('background', 'rgba(29, 185, 84, 0.2)');
                    }
                })
                .on('mouseout', function () {
                    d3.select(this).style('background', 'transparent');
                })
                .on('click', function () {
                    if (isSelected) return;

                    if (selectedArtistsForRadar.length >= 4) {
                        showModal('Maximum 4 artists allowed');
                        return;
                    }

                    selectedArtistsForRadar.push(artist);
                    searchInput.property('value', '');
                    resultsDropdown.style('display', 'none');
                    updateArtistChips();
                    updateRadarChart();

                    // Mostrar músicas do primeiro artista selecionado
                    if (typeof createArtistSongsView === 'function') {
                        createArtistSongsView(artist);
                    }
                });

            if (isSelected) {
                item.append('span')
                    .style('margin-left', '8px')
                    .style('color', '#1DB954')
                    .text('✓');
            }
        });

        if (artists.length > 100) {
            resultsDropdown.append('div')
                .style('padding', '10px 12px')
                .style('color', '#666')
                .style('font-size', '12px')
                .style('text-align', 'center')
                .text(`...and ${artists.length - 100} more`);
        }

        resultsDropdown.style('display', 'block');
    }

    // Função de pesquisa
    searchInput.on('input', function () {
        const query = this.value.toLowerCase().trim();

        if (query.length === 0) {
            renderArtistList(allArtists); // Show all (limited by render function)
            return;
        }

        const filtered = allArtists.filter(artist =>
            artist.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            resultsDropdown.selectAll('*').remove();
            resultsDropdown.append('div')
                .style('padding', '10px 12px')
                .style('color', '#666')
                .style('font-size', '14px')
                .style('text-align', 'center')
                .text('No artists found');
            resultsDropdown.style('display', 'block');
            return;
        }

        renderArtistList(filtered);
    });

    // Fechar dropdown ao clicar fora
    d3.select('body').on('click', function (event) {
        if (!searchContainer.node().contains(event.target)) {
            resultsDropdown.style('display', 'none');
        }
    });

    // Mostrar todos os artistas ao focar + border color
    searchInput.on('focus', function () {
        d3.select(this).style('border-color', '#1DB954');
        const query = this.value.toLowerCase().trim();

        if (query.length === 0) {
            renderArtistList(allArtists);
        } else {
            const filtered = allArtists.filter(artist =>
                artist.toLowerCase().includes(query)
            );
            renderArtistList(filtered);
        }
    }).on('blur', function () {
        setTimeout(() => {
            d3.select(this).style('border-color', '#3A3A3A');
        }, 200);
    });

    radarSvg = d3.select('#radar-chart')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2 + 40})`);

    // Eixos do radar
    const axes = [
        { name: 'Energy', key: 'energy' },
        { name: 'Danceability', key: 'danceability' },
        { name: 'Acousticness', key: 'acousticness' },
        { name: 'Valence', key: 'valence' },
        { name: 'Speechiness', key: 'speechiness' }
    ];

    const angleSlice = (Math.PI * 2) / axes.length;

    radarScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);

    for (let i = 1; i <= 5; i++) {
        radarSvg.append('circle')
            .attr('r', radius / 5 * i)
            .attr('fill', 'none')
            .attr('stroke', '#3A3A3A')
            .attr('stroke-width', 1);
    }

    // Eixos e labels
    axes.forEach((axis, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        radarSvg.append('line')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', x).attr('y2', y)
            .attr('stroke', '#3A3A3A')
            .attr('stroke-width', 2);

        radarSvg.append('text')
            .attr('x', x * 1.3)
            .attr('y', y * 1.3)
            .attr('text-anchor', getTextAnchor(i, axes.length))
            .attr('fill', '#EDEDED')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('max-width', '80px')
            .text(axis.name);
    });

    radarSvg.append('text')
        .attr('id', 'radar-placeholder')
        .attr('text-anchor', 'middle')
        .attr('y', 10)
        .attr('fill', '#B3B3B3')
        .style('font-size', '14px')
        .text('Select artists above to compare');

    // Call updateArtistChips to restore state
    updateArtistChips();
    updateRadarChart();
}

function getTextAnchor(index, total) {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const degrees = (angle * 180 / Math.PI + 360) % 360;

    if (degrees > 45 && degrees < 135) return 'start';  // Direita
    if (degrees > 225 && degrees < 315) return 'end';   // Esquerda
    return 'middle'; // Topo/fundo
}

function updateArtistChips() {
    const chipsContainer = d3.select('#artist-chips');

    const chips = chipsContainer.selectAll('.artist-chip')
        .data(selectedArtistsForRadar, d => d);

    const chipEnter = chips.enter()
        .append('div')
        .attr('class', 'artist-chip')
        .style('display', 'inline-flex')
        .style('align-items', 'center')
        .style('gap', '8px')
        .style('padding', '6px 12px')
        .style('background', 'linear-gradient(135deg, #1DB954 0%, #1ED760 100%)')
        .style('color', '#121212')
        .style('border-radius', '20px')
        .style('font-size', '13px')
        .style('font-weight', '600');

    chipEnter.append('span').text(d => d);

    chipEnter.append('button')
        .style('background', 'none')
        .style('border', 'none')
        .style('color', '#121212')
        .style('font-size', '16px')
        .style('cursor', 'pointer')
        .style('padding', '0')
        .style('width', '18px')
        .style('height', '18px')
        .text('×')
        .on('click', function (event, d) {
            selectedArtistsForRadar = selectedArtistsForRadar.filter(a => a !== d);
            updateArtistChips();
            updateRadarChart();
        });

    chips.exit().remove();
}

function updateRadarChart() {
    if (selectedArtistsForRadar.length === 0) {
        d3.select('#radar-placeholder').style('display', 'block');
        radarSvg.selectAll('.radar-area').remove();
        radarSvg.selectAll('.radar-legend').remove();
        radarSvg.selectAll('.radar-point').remove();
        return;
    }

    d3.select('#radar-placeholder').style('display', 'none');

    const axes = ['energy', 'danceability', 'acousticness', 'valence', 'speechiness'];
    const angleSlice = (Math.PI * 2) / axes.length;

    const artistProfiles = selectedArtistsForRadar.map(artist => {
        const artistTracks = appState.data.filter(d => d.artist === artist);
        return {
            artist: artist,
            values: axes.map(axis => ({
                axis: axis,
                value: d3.mean(artistTracks, d => d[axis]) || 0.5
            }))
        };
    });

    const radarLine = d3.lineRadial()
        .angle((d, i) => angleSlice * i)
        .radius(d => radarScale(d.value))
        .curve(d3.curveLinearClosed);

    radarSvg.selectAll('.radar-area').remove();
    radarSvg.selectAll('.radar-legend').remove();
    radarSvg.selectAll('.radar-point').remove();

    const artistColors = d3.scaleOrdinal()
        .domain(selectedArtistsForRadar)
        .range(['#ff5100ff', '#9C27B0', '#00BCD4', '#FFC107']);

    // Draw all areas first
    artistProfiles.forEach(profile => {
        radarSvg.append('path')
            .datum(profile.values)
            .attr('class', 'radar-area')
            .attr('d', radarLine)
            .attr('fill', artistColors(profile.artist))
            .attr('opacity', 0.3)
            .attr('stroke', artistColors(profile.artist))
            .attr('stroke-width', 2);
    });

    // Then draw all points on top so they're all accessible
    artistProfiles.forEach(profile => {
        profile.values.forEach((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = radarScale(d.value) * Math.cos(angle);
            const y = radarScale(d.value) * Math.sin(angle);

            radarSvg.append('circle')
                .attr('class', 'radar-point')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 5)
                .attr('fill', artistColors(profile.artist))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .style('cursor', 'pointer')
                .on('mouseover', function (event) {
                    d3.select(this).attr('r', 8);

                    d3.select('body').append('div')
                        .attr('class', 'radar-tooltip')
                        .style('position', 'absolute')
                        .style('background', '#1A1A1A')
                        .style('color', '#EDEDED')
                        .style('padding', '8px 12px')
                        .style('border', `1px solid ${artistColors(profile.artist)}`)
                        .style('border-radius', '4px')
                        .style('pointer-events', 'none')
                        .style('font-size', '12px')
                        .style('z-index', 1000)
                        .html(`
                            <strong>${profile.artist}</strong><br>
                            ${d.axis}: ${d.value.toFixed(2)}
                        `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px');
                })
                .on('mouseout', function () {
                    d3.select(this).attr('r', 5);
                    d3.selectAll('.radar-tooltip').remove();
                });
        });
    });

    // Legenda
    const legend = radarSvg.append('g')
        .attr('class', 'radar-legend')
        .attr('transform', 'translate(180, -200)');

    artistProfiles.forEach((profile, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        legendRow.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', artistColors(profile.artist));

        legendRow.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('fill', '#EDEDED')
            .style('font-size', '12px')
            .text(profile.artist);
    });
}

// Handle resize
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimerRadar);
    window.resizeTimerRadar = setTimeout(() => {
        if (document.getElementById('radar-chart').offsetParent) {
            createRadarChart();
        }
    }, 250);
});
