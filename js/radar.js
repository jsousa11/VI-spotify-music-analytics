let radarSvg, radarScale, radarAngleSlice;
let selectedArtistsForRadar = [];

function createRadarChart() {
    const margin = {top: 50, right: 100, bottom: 50, left: 100};
    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 50;
    
    // Limpar tudo
    d3.select('#radar-chart').selectAll('*').remove();
    d3.select('#artist-select').selectAll('*').remove();
    
    // Criar interface de seleção
    const artistSelect = d3.select('#artist-select');
    
    artistSelect.append('label')
        .style('display', 'block')
        .style('margin-bottom', '12px')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('color', '#1DB954')
        .text('Select artists to compare (max 4):');
    
    // Container de chips
    artistSelect.append('div')
        .attr('id', 'artist-chips')
        .attr('class', 'selected-artists-chips')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '8px')
        .style('margin-bottom', '12px')
        .style('min-height', '40px')
        .style('padding', '8px')
        .style('background', 'rgba(42, 42, 42, 0.3)')
        .style('border-radius', '8px');
    
    // Dropdown
    const dropdown = artistSelect.append('select')
        .attr('id', 'artist-dropdown')
        .style('width', '100%')
        .style('padding', '12px')
        .style('background', '#2A2A2A')
        .style('border', '2px solid #3A3A3A')
        .style('color', '#EDEDED')
        .style('border-radius', '8px')
        .style('font-size', '14px')
        .on('change', function() {
            const artist = this.value;
            if (!artist) return;
            
            if (selectedArtistsForRadar.length >= 4) {
                alert('Maximum 4 artists allowed');
                this.value = '';
                return;
            }
            
            if (!selectedArtistsForRadar.includes(artist)) {
                selectedArtistsForRadar.push(artist);
                updateArtistChips();
                updateRadarChart();
            }
            
            this.value = '';
        });
    
    // Popular dropdown
    const topArtists = getTopArtists(appState.data, 50);
    
    dropdown.append('option')
        .attr('value', '')
        .text('-- Select an artist --');
    
    dropdown.selectAll('option.artist-option')
        .data(topArtists)
        .enter()
        .append('option')
        .attr('class', 'artist-option')
        .attr('value', d => d)
        .text(d => d);
    
    // Criar SVG do radar
    radarSvg = d3.select('#radar-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Eixos do radar
    const axes = [
        {name: 'Energy', key: 'energy'},
        {name: 'Danceability', key: 'danceability'},
        {name: 'Acousticness', key: 'acousticness'},
        {name: 'Valence', key: 'valence'},
        {name: 'Instrumentalness', key: 'instrumentalness'}
    ];
    
    const angleSlice = (Math.PI * 2) / axes.length;
    
    radarScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);
    
    // Círculos de fundo
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
            .attr('x', x * 1.15)
            .attr('y', y * 1.15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#EDEDED')
            .style('font-size', '13px')
            .style('font-weight', 'bold')
            .text(axis.name);
    });
    
    radarSvg.append('text')
        .attr('id', 'radar-placeholder')
        .attr('text-anchor', 'middle')
        .attr('y', 10)
        .attr('fill', '#B3B3B3')
        .style('font-size', '14px')
        .text('Select artists above to compare');
}

function updateArtistChips() {
    const chipsContainer = d3.select('#artist-chips');
    
    const chips = chipsContainer.selectAll('.artist-chip')
        .data(selectedArtistsForRadar, d => d);
    
    // Enter
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
        .on('click', function(event, d) {
            selectedArtistsForRadar = selectedArtistsForRadar.filter(a => a !== d);
            updateArtistChips();
            updateRadarChart();
        });
    
    // Exit
    chips.exit().remove();
}

function updateRadarChart() {
    if (selectedArtistsForRadar.length === 0) {
        d3.select('#radar-placeholder').style('display', 'block');
        radarSvg.selectAll('.radar-area').remove();
        radarSvg.selectAll('.radar-legend').remove();
        return;
    }
    
    d3.select('#radar-placeholder').style('display', 'none');
    
    const axes = ['energy', 'danceability', 'acousticness', 'valence', 'instrumentalness'];
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
    
    const artistColors = d3.scaleOrdinal()
        .domain(selectedArtistsForRadar)
        .range(['#E91E63', '#9C27B0', '#00BCD4', '#FFC107']);
    
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
