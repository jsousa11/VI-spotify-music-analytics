let popXScale, popYScale;

function createPopularityScatter() {
    const container = document.getElementById('popularity-scatter');
    const containerRect = container.getBoundingClientRect();

    const margin = { top: 20, right: 150, bottom: 50, left: 60 };
    const width = (containerRect.width || 900) - margin.left - margin.right;
    const height = (containerRect.height || 400) - margin.top - margin.bottom;

    d3.select('#popularity-scatter').selectAll('*').remove();

    const svg = d3.select('#popularity-scatter')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Agregar dados: contar músicas por artista
    const artistData = d3.rollup(
        appState.filteredData,
        v => ({
            count: v.length,
            avgPopularity: d3.mean(v, d => d.popularity),
            genre: v[0].genre
        }),
        d => d.artist
    );

    const scatterData = Array.from(artistData, ([artist, data]) => ({
        artist: artist,
        num_songs: data.count,
        popularity: data.avgPopularity,
        genre: data.genre
    }));

    // Escalas
    popXScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    popYScale = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.num_songs) + 2])
        .range([height, 0]);

    // Eixos
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(popXScale))
        .selectAll('text')
        .style('fill', '#B3B3B3');

    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(popYScale))
        .selectAll('text')
        .style('fill', '#B3B3B3');

    // Grid
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(popYScale)
            .tickSize(-width)
            .tickFormat(''));

    // Labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Popularity');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Number of Songs');

    // Círculos
    const circles = svg.selectAll('circle')
        .data(scatterData)
        .enter()
        .append('circle')
        .attr('cx', d => popXScale(d.popularity))
        .attr('cy', d => popYScale(d.num_songs))
        .attr('r', 5)
        .attr('fill', d => getGenreColor(d.genre))
        .attr('opacity', 0.7)
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .on('mouseover', function (event, d) {
            d3.select(this)
                .attr('r', 8)
                .attr('opacity', 1);

            // Tooltip
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', '#2A2A2A')
                .style('padding', '10px')
                .style('border', '1px solid #1DB954')
                .style('border-radius', '5px')
                .style('pointer-events', 'none')
                .html(`
                    <strong>${d.artist}</strong><br>
                    Songs: ${d.num_songs}<br>
                    Popularity: ${d.popularity.toFixed(1)}<br>
                    Genre: ${d.genre}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this)
                .attr('r', 5)
                .attr('opacity', 0.7);
            d3.selectAll('.tooltip').remove();
        });

    // Legenda
    const topGenres = [...new Set(scatterData.map(d => d.genre))].slice(0, 6);
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 20}, 0)`);

    topGenres.forEach((genre, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);

        legendRow.append('circle')
            .attr('r', 5)
            .attr('fill', getGenreColor(genre));

        legendRow.append('text')
            .attr('x', 10)
            .attr('y', 5)
            .attr('fill', '#EDEDED')
            .style('font-size', '11px')
            .text(genre);
    });
}

function updatePopularityScatter() {
    createPopularityScatter();
}

// Handle resize
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimerPop);
    window.resizeTimerPop = setTimeout(() => {
        if (document.getElementById('popularity-scatter').offsetParent) {
            createPopularityScatter();
        }
    }, 250);
});
