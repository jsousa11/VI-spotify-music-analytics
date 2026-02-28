let variablesTimelineSvg, varTimelineXScale, varTimelineYScale;
let visibleVariables = new Set(['acousticness', 'danceability', 'energy', 'valence', 'speechiness']);

function createVariablesTimeline() {
    d3.select('#variables-timeline').selectAll('*').remove();

    const container = document.getElementById('variables-timeline');
    const containerRect = container.getBoundingClientRect();

    const margin = { top: 20, right: 180, bottom: 50, left: 60 };
    const width = (containerRect.width || 800) - margin.left - margin.right;
    const height = (containerRect.height || 400) - margin.top - margin.bottom;

    const svg = d3.select('#variables-timeline')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    variablesTimelineSvg = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Agrupar dados POR ANO
    // Expand year range if too small (1-2 years) to show context
    let displayYearRange = [...appState.yearRange];
    if (displayYearRange[0] > displayYearRange[1]) {
        displayYearRange = [displayYearRange[1], displayYearRange[0]];
    }
    const selectedYearSpan = displayYearRange[1] - displayYearRange[0];

    if (selectedYearSpan <= 1) {
        const minAvailable = 2000; // Dataset minimum
        const maxAvailable = 2023; // Dataset maximum

        displayYearRange[0] = Math.max(minAvailable, displayYearRange[0] - 1);
        displayYearRange[1] = Math.min(maxAvailable, displayYearRange[1] + 1);
    }


    // Use filteredData (which already has genre/popularity filters applied)
    // but expand the year range for better visualization context
    const displayData = appState.filteredData.filter(d => d.year >= displayYearRange[0] && d.year <= displayYearRange[1]);

    // Also include data from expanded years (if any) that match genre/popularity filters
    if (selectedYearSpan <= 1) {
        const expandedYearData = appState.data.filter(d => {
            const genreMatch = appState.selectedGenres.length === 0 ||
                appState.selectedGenres.some(g => d.genre === g.toLowerCase());
            const popularityMatch = d.popularity >= appState.minPopularity;
            const inExpandedRange = d.year >= displayYearRange[0] && d.year <= displayYearRange[1];
            const notInOriginalRange = d.year < appState.yearRange[0] || d.year > appState.yearRange[1];
            return genreMatch && popularityMatch && inExpandedRange && notInOriginalRange;
        });
        displayData.push(...expandedYearData);
    }

    const yearData = d3.rollups(
        displayData,
        v => ({
            acousticness: d3.mean(v, d => d.acousticness * 100),
            danceability: d3.mean(v, d => d.danceability * 100),
            energy: d3.mean(v, d => d.energy * 100),
            valence: d3.mean(v, d => d.valence * 100),
            speechiness: d3.mean(v, d => d.speechiness * 100)
        }),
        d => d.year
    ).sort((a, b) => a[0] - b[0]);

    // Create a complete range of years from displayYearRange
    const allYears = [];
    for (let year = displayYearRange[0]; year <= displayYearRange[1]; year++) {
        allYears.push(year);
    }

    // Convert yearData array to a Map for easier lookup
    const yearDataMap = new Map(yearData);

    // Fill in missing years with previous year's values (or 0 if no previous data)
    const completeYearData = allYears.map(year => {
        if (yearDataMap.has(year)) {
            return [year, yearDataMap.get(year)];
        } else {
            // Find the most recent year with data before this year
            let previousData = null;
            for (let y = year - 1; y >= displayYearRange[0]; y--) {
                if (yearDataMap.has(y)) {
                    previousData = yearDataMap.get(y);
                    break;
                }
            }
            // Use previous data or zeros if no previous data exists
            return [year, previousData || {
                acousticness: 0,
                danceability: 0,
                energy: 0,
                valence: 0,
                speechiness: 0
            }];
        }
    });

    // Variáveis com cores
    const variables = [
        { key: 'acousticness', name: 'Acousticness', color: '#E91E63' },
        { key: 'danceability', name: 'Danceability', color: '#00E5FF' },
        { key: 'energy', name: 'Energy', color: '#76FF03' },
        { key: 'valence', name: 'Valence', color: '#FF6D00' },
        { key: 'speechiness', name: 'Speechiness', color: '#AA00FF' }
    ];

    // Escalas
    varTimelineXScale = d3.scaleLinear()
        .domain([displayYearRange[0], displayYearRange[1]])
        .range([0, width]);

    varTimelineYScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    // Grid horizontal
    variablesTimelineSvg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.15)
        .call(d3.axisLeft(varTimelineYScale)
            .tickSize(-width)
            .tickFormat(''))
        .selectAll('line')
        .attr('stroke', '#444');

    // Área preenchida generator - STRAIGHT LINES
    const area = d3.area()
        .x(d => varTimelineXScale(d.year))
        .y0(height)
        .y1(d => varTimelineYScale(d.value))
        .curve(d3.curveLinear); // Changed to Linear

    // Line generator - STRAIGHT LINES
    const line = d3.line()
        .x(d => varTimelineXScale(d.year))
        .y(d => varTimelineYScale(d.value))
        .curve(d3.curveLinear); // Changed to Linear

    // Desenhar áreas e linhas para cada variável
    variables.forEach((variable, index) => {
        const lineData = completeYearData.map(d => ({
            year: d[0],
            value: d[1][variable.key]
        }));

        // Gradient
        const gradient = variablesTimelineSvg.append('defs')
            .append('linearGradient')
            .attr('id', `gradient-${variable.key}`)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', variable.color)
            .attr('stop-opacity', 0.3);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', variable.color)
            .attr('stop-opacity', 0.05);

        // Área
        variablesTimelineSvg.append('path')
            .datum(lineData)
            .attr('class', `variable-area variable-area-${variable.key}`)
            .attr('fill', `url(#gradient-${variable.key})`)
            .attr('d', area)
            .style('opacity', visibleVariables.has(variable.key) ? 1 : 0)
            .style('pointer-events', 'none');

        // Linha principal
        const path = variablesTimelineSvg.append('path')
            .datum(lineData)
            .attr('class', `variable-line variable-line-${variable.key} line-${index}`)
            .attr('fill', 'none')
            .attr('stroke', variable.color)
            .attr('stroke-width', 4)
            .attr('d', line)
            .style('opacity', visibleVariables.has(variable.key) ? 0.95 : 0)
            .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))')
            .style('cursor', 'pointer');

        // ✅ PONTOS (invisíveis por defeito)
        const points = variablesTimelineSvg.selectAll(`.point-${index}`)
            .data(lineData)
            .enter()
            .append('circle')
            .attr('class', `point point-${index}`)
            .attr('cx', d => varTimelineXScale(d.year))
            .attr('cy', d => varTimelineYScale(d.value))
            .attr('r', 4)
            .attr('fill', variable.color)
            .attr('stroke', '#1A1A1A')
            .attr('stroke-width', 2)
            .style('opacity', 0)  // ✅ Invisível por defeito
            .style('cursor', 'pointer');

        // ✅ HOVER NA LINHA (mostra pontos)
        path.on('mouseover', function () {
            if (!visibleVariables.has(variable.key)) return;

            d3.select(this)
                .style('opacity', 1)
                .attr('stroke-width', 6);

            d3.selectAll('.variable-line').style('opacity', 0.2);
            d3.selectAll('.variable-area').style('opacity', 0.1);
            d3.select(this).style('opacity', 1);
            d3.select(`.variable-area-${variable.key}`).style('opacity', 1);

            // ✅ MOSTRAR pontos
            variablesTimelineSvg.selectAll(`.point-${index}`)
                .style('opacity', 1);
        })
            .on('mouseout', function () {
                d3.selectAll('.variable-line').each(function () {
                    const className = d3.select(this).attr('class');
                    const match = className.match(/variable-line-(\w+)/);
                    if (match && visibleVariables.has(match[1])) {
                        d3.select(this).style('opacity', 0.95).attr('stroke-width', 4);
                    }
                });

                d3.selectAll('.variable-area').style('opacity', 1);

                // ✅ ESCONDER pontos
                variablesTimelineSvg.selectAll(`.point-${index}`)
                    .style('opacity', 0);
            });

        // ✅ HOVER NOS PONTOS (tooltip)
        points.on('mouseover', function (event, d) {
            d3.select(this)
                .style('opacity', 1)
                .attr('r', 6);

            // Mostrar todos os pontos da linha
            variablesTimelineSvg.selectAll(`.point-${index}`)
                .style('opacity', 1);

            // Tooltip
            d3.selectAll('.var-tooltip').remove();

            d3.select('body').append('div')
                .attr('class', 'var-tooltip')
                .style('position', 'absolute')
                .style('background', '#1A1A1A')
                .style('color', '#EDEDED')
                .style('padding', '12px 16px')
                .style('border', `2px solid ${variable.color}`)
                .style('border-radius', '8px')
                .style('pointer-events', 'none')
                .style('font-size', '13px')
                .style('box-shadow', '0 6px 16px rgba(0,0,0,0.7)')
                .style('z-index', 1000)
                .html(`
                    <div style="font-weight: bold; color: ${variable.color}; margin-bottom: 6px; font-size: 14px;">${variable.name}</div>
                    <div><strong>Year:</strong> ${d.year}</div>
                    <div><strong>Value:</strong> ${d.value.toFixed(1)}%</div>
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
            .on('mouseout', function () {
                d3.select(this)
                    .style('opacity', 0)
                    .attr('r', 4);

                d3.selectAll('.var-tooltip').remove();
            });
    });

    // Eixos
    // Calculate number of ticks based on year span to avoid duplicates
    const minYear = displayYearRange[0];
    const maxYear = displayYearRange[1];
    const yearSpan = maxYear - minYear;
    const numTicks = Math.min(yearSpan, 15);

    const xAxis = d3.axisBottom(varTimelineXScale)
        .tickFormat(d3.format('d'))
        .ticks(numTicks);

    variablesTimelineSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', '12px');

    variablesTimelineSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(varTimelineYScale).tickFormat(d => d + '%'))
        .selectAll('text')
        .style('font-size', '12px');

    // Labels
    variablesTimelineSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Year');

    variablesTimelineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Average Value (%)');


    // Legenda
    const legend = variablesTimelineSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 25}, 20)`);

    legend.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('fill', '#1DB954')
        .style('font-size', '13px')
        .style('font-weight', '700')
        .text('Click to toggle:');

    variables.forEach((variable, i) => {
        const legendRow = legend.append('g')
            .attr('class', `legend-item legend-item-${variable.key}`)
            .attr('transform', `translate(0, ${i * 32})`)
            .style('cursor', 'pointer')
            .on('click', function () {
                if (visibleVariables.has(variable.key)) {
                    visibleVariables.delete(variable.key);
                } else {
                    visibleVariables.add(variable.key);
                }

                const isVisible = visibleVariables.has(variable.key);

                d3.select(`.variable-line-${variable.key}`)
                    .transition().duration(300)
                    .style('opacity', isVisible ? 0.95 : 0);

                d3.select(`.variable-area-${variable.key}`)
                    .transition().duration(300)
                    .style('opacity', isVisible ? 1 : 0);

                d3.select(this).select('line')
                    .transition().duration(200)
                    .attr('stroke', isVisible ? variable.color : '#333')
                    .attr('stroke-width', isVisible ? 3 : 2);

                d3.select(this).select('text')
                    .transition().duration(200)
                    .attr('fill', isVisible ? '#EDEDED' : '#666')
                    .style('text-decoration', isVisible ? 'none' : 'line-through');
            })
            .on('mouseover', function () {
                if (!visibleVariables.has(variable.key)) return;

                d3.selectAll('.variable-line').style('opacity', 0.2);
                d3.selectAll('.variable-area').style('opacity', 0.1);

                d3.select(`.line-${i}`)
                    .raise()
                    .style('opacity', 1)
                    .attr('stroke-width', 6);

                d3.select(`.variable-area-${variable.key}`)
                    .style('opacity', 1);

                variablesTimelineSvg.selectAll(`.point-${i}`)
                    .style('opacity', 1);

                d3.select(this).select('line')
                    .attr('stroke-width', 5);

                d3.select(this).select('text')
                    .style('font-weight', 'bold');
            })
            .on('mouseout', function () {
                d3.selectAll('.variable-line').each(function () {
                    const className = d3.select(this).attr('class');
                    const match = className.match(/variable-line-(\w+)/);
                    if (match && visibleVariables.has(match[1])) {
                        d3.select(this)
                            .style('opacity', 0.95)
                            .attr('stroke-width', 4);
                    }
                });

                d3.selectAll('.variable-area').each(function () {
                    const className = d3.select(this).attr('class');
                    const match = className.match(/variable-area-(\w+)/);
                    if (match && visibleVariables.has(match[1])) {
                        d3.select(this).style('opacity', 1);
                    }
                });

                variablesTimelineSvg.selectAll(`.point-${i}`)
                    .style('opacity', 0);

                d3.select(this).select('line')
                    .attr('stroke-width', 3);

                d3.select(this).select('text')
                    .style('font-weight', '500');
            });

        legendRow.append('line')
            .attr('x1', 0)
            .attr('x2', 25)
            .attr('y1', 9)
            .attr('y2', 9)
            .attr('stroke', variable.color)
            .attr('stroke-width', 3);

        legendRow.append('text')
            .attr('x', 30)
            .attr('y', 13)
            .attr('fill', '#EDEDED')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .text(variable.name);
    });
}

function updateVariablesTimeline() {
    createVariablesTimeline();
}

// Handle resize
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimerVar);
    window.resizeTimerVar = setTimeout(() => {
        if (document.getElementById('variables-timeline').offsetParent) {
            createVariablesTimeline();
        }
    }, 250);
});
