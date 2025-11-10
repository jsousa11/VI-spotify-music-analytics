let timelineSvg, timelineXScale, timelineYScale, timelineColorScale, timelineBrush;
let timelineData = [];

function createTimeline() {
    const margin = {top: 20, right: 120, bottom: 60, left: 60};
    const width = 1000 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    d3.select('#timeline').selectAll('*').remove();
    
    timelineSvg = d3.select('#timeline')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Preparar dados agregados por ano e género
    const topGenres = getTopGenresByCount(appState.data, 8); // Top 8 géneros

    // Agrupar por ano e género
    const dataByYear = d3.rollups(
        appState.filteredData.filter(d => topGenres.includes(d.genre)),
        v => v.length,
        d => d.year,
        d => d.genre
    );
    
    // Transformar para formato de stack
    const years = d3.range(appState.yearRange[0], appState.yearRange[1] + 1);
    timelineData = years.map(year => {
        const yearData = {year: year};
        const genreData = dataByYear.find(d => d[0] === year);
        
        topGenres.forEach(genre => {
            if (genreData) {
                const genreCount = genreData[1].find(g => g[0] === genre);
                yearData[genre] = genreCount ? genreCount[1] : 0;
            } else {
                yearData[genre] = 0;
            }
        });
        
        return yearData;
    });
    
    // Escalas
    timelineXScale = d3.scaleLinear()
        .domain([appState.yearRange[0], appState.yearRange[1]])
        .range([0, width]);
    
    timelineYScale = d3.scaleLinear()
        .domain([0, d3.max(timelineData, d => d3.sum(topGenres, genre => d[genre]))])
        .range([height, 0]);
    
    timelineColorScale = d3.scaleOrdinal()
        .domain(topGenres)
        .range(topGenres.map(g => genreColors[g] || '#888'));
    
    // Stack generator
    const stack = d3.stack()
        .keys(topGenres)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
    
    const series = stack(timelineData);
    
    // Area generator
    const area = d3.area()
        .x(d => timelineXScale(d.data.year))
        .y0(d => timelineYScale(d[0]))
        .y1(d => timelineYScale(d[1]))
        .curve(d3.curveMonotoneX);
    
    // Desenhar áreas
    timelineSvg.selectAll('.area')
        .data(series)
        .enter()
        .append('path')
        .attr('class', 'area')
        .attr('d', area)
        .attr('fill', d => timelineColorScale(d.key))
        .attr('opacity', 0.8)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.8);
        });
    
    // Eixos
    const xAxis = d3.axisBottom(timelineXScale)
        .tickFormat(d3.format('d'))
        .ticks(10);
    
    timelineSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);
    
    timelineSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(timelineYScale));
    
    // Labels
    timelineSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .text('Year');
    
    timelineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .text('Number of Songs');
    
    // Legenda
    const legend = timelineSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 10}, 0)`);
    
    topGenres.forEach((genre, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        legendRow.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', timelineColorScale(genre));
        
        legendRow.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .attr('fill', '#EDEDED')
            .style('font-size', '12px')
            .text(genre);
    });
    
    // Brush para seleção temporal
    timelineBrush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on('end', brushed);
    
    const brushGroup = timelineSvg.append('g')
        .attr('class', 'brush')
        .call(timelineBrush);
    
    // Estilo do brush
    brushGroup.selectAll('.selection')
        .attr('fill', '#1DB954')
        .attr('opacity', 0.3);
}

function brushed(event) {
    if (!event.selection) return;
    
    const [x0, x1] = event.selection;
    const newRange = [
        Math.round(timelineXScale.invert(x0)),
        Math.round(timelineXScale.invert(x1))
    ];
    
    appState.yearRange = newRange;
    
    // Atualizar display do filtro
    d3.select('#year-range-display').text(`${newRange[0]} - ${newRange[1]}`);
    d3.select('#year-min').property('value', newRange[0]);
    d3.select('#year-max').property('value', newRange[1]);
    
    // Atualizar visualizações
    updateAllVisualizations();
}

function updateTimeline() {
    createTimeline();
}

function getTopGenresByCount(data, n = 8) {
    // Contar por género
    const genreCounts = d3.rollup(
        data,
        v => v.length,
        d => d.genre
    );
    
    // Ordenar e pegar top N
    const topGenres = [...genreCounts.entries()]
        .filter(([genre, count]) => genre && genre !== 'unknown' && genre.length > 2)
        .sort((a, b) => b[1] - a[1])  // Ordenar por contagem decrescente
        .slice(0, n)
        .map(([genre, count]) => genre);
    
    // FALLBACK
    if (topGenres.length === 0) {
        console.warn('No genres found, using defaults');
        return ['pop', 'rock', 'hip hop', 'electronic', 'latin', 'r&b', 'country', 'jazz'];
    }
    
    return topGenres;
}

