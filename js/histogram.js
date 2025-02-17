function createHistograms(table) {
    if (!activateHistograms || !table.container) return;

    // Create histogram row and store reference
    table.histogramRow = document.createElement('tr');
    table.histogramRow.id = 'histogramRow' + table.index;
    table.histogramRow.style.height = '45px';
    table.container.appendChild(table.histogramRow);

    // Create cells for each column
    table.keys.forEach((key, i) => {
        const cell = document.createElement('td');
        cell.style.padding = '1px 2px';
        cell.style.position = 'relative';
        cell.style.verticalAlign = 'top';
        cell.style.border = '1px solid #ddd';
        table.histogramRow.appendChild(cell);
        createHistogramForColumn(key, table, cell, i);
    });

    // Add histogram for Score column
    const scoreCell = document.createElement('td');
    scoreCell.style.padding = '1px 2px';
    scoreCell.style.position = 'relative';
    scoreCell.style.verticalAlign = 'top';
    scoreCell.style.border = '1px solid #ddd';
    table.histogramRow.appendChild(scoreCell);
    createHistogramForColumn("Score", table, scoreCell, table.keys.length);
}

function createHistogramBins(values, min, max, thresholds) {
    // Create bins array
    const bins = [];
    
    // Initialize bins
    for (let i = 0; i < thresholds.length + 1; i++) {
        const x0 = i === 0 ? min : thresholds[i - 1];
        const x1 = i === thresholds.length ? max : thresholds[i];
        bins.push({
            x0: x0,
            x1: x1,
            length: 0
        });
    }
    
    // Fill bins with values
    values.forEach(value => {
        for (let i = 0; i < bins.length; i++) {
            if (value >= bins[i].x0 && (i === bins.length - 1 || value < bins[i].x1)) {
                bins[i].length++;
                break;
            }
        }
    });
    
    return bins;
}

function createHistogramForColumn(column, table, cell, index) {
    // Handle both numeric and categorical data
    let values;
    if (column === "Score") {
        values = table.data.map(d => parseFloat(d[column])).filter(d => !isNaN(d));
    } else {
        values = table.data.map(d => {
            const val = d[column];
            if (!isNaN(parseFloat(val))) {
                return parseFloat(val);
            } else if (categoricalMappings[column]?.[val] !== undefined) {
                return categoricalMappings[column][val];
            }
            return NaN;
        }).filter(d => !isNaN(d));
    }

    if (values.length === 0) return;

    // Calculate total number of elements across all tables for this column
    const totalElements = tableList.reduce((sum, currentTable) => {
        const tableValues = currentTable.data.map(d => {
            const val = d[column];
            if (column === "Score") {
                return parseFloat(val);
            }
            if (!isNaN(parseFloat(val))) {
                return parseFloat(val);
            } else if (categoricalMappings[column]?.[val] !== undefined) {
                return categoricalMappings[column][val];
            }
            return NaN;
        }).filter(d => !isNaN(d));
        return sum + tableValues.length;
    }, 0);

    // Use column-specific min/max values and thresholds
    const minVal = column === "Score" ? 0 : globalMin[column];
    const maxVal = column === "Score" ? 1 : globalMax[column];
    
    // Special handling for Score column: always 10 bins
    const thresholds = column === "Score" ? 
        Array.from({length: 9}, (_, i) => (i + 1) * 0.1) : // 9 thresholds for 10 bins
        getBinThresholds(values, minVal, maxVal);

    // Create histogram bins with fixed domain
    const bins = createHistogramBins(values, minVal, maxVal, thresholds);

    // Setup dimensions
    const margin = {top: 2, right: 2, bottom: 12, left: 2};
    
    // Get actual cell dimensions
    const cellRect = cell.getBoundingClientRect();
    const cellWidth = cellRect.width;
    const cellHeight = cellRect.height || 45; // Fallback to 45 if height is 0
    
    // Calculate usable space
    const width = cellWidth - margin.left - margin.right;
    const height = cellHeight - margin.top - margin.bottom;

    // Create SVG with proper dimensions
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = 'hist' + index;
    svg.setAttribute('width', '100%');  // Make SVG fill cell width
    svg.setAttribute('height', '100%'); // Make SVG fill cell height
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    
    // Set viewBox for proper scaling
    svg.setAttribute('viewBox', `0 0 ${cellWidth} ${cellHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    cell.appendChild(svg);

    // Create group for margin convention
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);

    // Add background rect
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute('class', 'background');
    background.setAttribute('x', 0);
    background.setAttribute('y', 0);
    background.setAttribute('width', width);
    background.setAttribute('height', height);
    background.style.fill = 'white';
    background.style.stroke = '#eee';
    background.style.strokeWidth = '0.5';
    g.appendChild(background);

    // Create scales
    const xScale = (value) => (value - minVal) / (maxVal - minVal) * width;
    const yScale = (value) => height - (value / totalElements * height);

    // Draw bars with proper scaling
    bins.forEach(bin => {
        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.setAttribute('class', 'data');
        bar.setAttribute('x', xScale(bin.x0));
        bar.setAttribute('width', Math.max(0, xScale(bin.x1) - xScale(bin.x0) - 0.3));
        bar.setAttribute('y', yScale(bin.length));
        bar.setAttribute('height', height - yScale(bin.length));
        bar.style.fill = 'steelblue';
        bar.style.stroke = '#222';
        bar.style.strokeWidth = '0.2';
        
        // Store bin data for color updates
        bar.dataset.x0 = bin.x0;
        bar.dataset.x1 = bin.x1;
        
        g.appendChild(bar);
    });

    // Add ideal value cursor line
    if (column !== "Score") {
        const idealX = xScale(idealValues[column]);
        
        const cursorLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        cursorLine.setAttribute('class', 'ideal-cursor');
        cursorLine.setAttribute('x1', idealX);
        cursorLine.setAttribute('x2', idealX);
        cursorLine.setAttribute('y1', 0);
        cursorLine.setAttribute('y2', height);
        cursorLine.style.stroke = 'black';
        cursorLine.style.strokeWidth = '1';
        cursorLine.style.strokeDasharray = '2,1';
        g.appendChild(cursorLine);

        // Add triangle at top
        const triangle = document.createElementNS("http://www.w3.org/2000/svg", "path");
        triangle.setAttribute('class', 'ideal-cursor-arrow');
        triangle.setAttribute('d', `M${idealX},${-1} L${idealX-4},${-5} L${idealX+4},${-5} Z`);
        triangle.style.fill = 'black';
        g.appendChild(triangle);
    }

    // Add axis
    const axis = document.createElementNS("http://www.w3.org/2000/svg", "g");
    axis.setAttribute('class', 'x-axis');
    axis.setAttribute('transform', `translate(0,${height})`);
    
    // Add ticks
    const tickCount = 3;
    const tickStep = (maxVal - minVal) / (tickCount - 1);
    for (let i = 0; i < tickCount; i++) {
        const tickValue = minVal + i * tickStep;
        const tickX = xScale(tickValue);
        
        // Tick line
        const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tickLine.setAttribute('x1', tickX);
        tickLine.setAttribute('x2', tickX);
        tickLine.setAttribute('y1', 0);
        tickLine.setAttribute('y2', 1.5);
        tickLine.style.stroke = 'black';
        tickLine.style.strokeWidth = '0.5';
        axis.appendChild(tickLine);
        
        // Tick label
        const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tickLabel.setAttribute('x', tickX);
        tickLabel.setAttribute('y', 3);
        tickLabel.style.fontSize = '6px';
        tickLabel.style.textAnchor = 'middle';
        tickLabel.textContent = tickValue.toFixed(1);
        axis.appendChild(tickLabel);
    }
    g.appendChild(axis);

    // Add range texts
    const texts = [
        {class: 'global-min-range', x: 0, y: -2, baseline: 'text-after-edge'},
        {class: 'global-max-range', x: width, y: -2, baseline: 'text-after-edge', anchor: 'end'},
        {class: 'min-range', x: 0, y: height + 10, baseline: 'text-before-edge'},
        {class: 'max-range', x: width, y: height + 10, baseline: 'text-before-edge', anchor: 'end'}
    ];

    texts.forEach(textInfo => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('class', textInfo.class);
        text.setAttribute('x', textInfo.x);
        text.setAttribute('y', textInfo.y);
        text.style.fontSize = '6px';
        if (textInfo.anchor) text.style.textAnchor = textInfo.anchor;
        text.style.dominantBaseline = textInfo.baseline;
        g.appendChild(text);
    });

    // Update colors
    updateHistogramColors(table);
}

function thresholdSturges(values, min, max) {
    let binCount = Math.ceil(Math.log2(values.length) + 1);
    binCount = Math.min(binCount, 50); // Limit to 50 bins
    
    const step = (max - min) / binCount;
    const thresholds = [];
    for (let i = 1; i < binCount; i++) {
        thresholds.push(min + i * step);
    }
    return thresholds;
}

function thresholdScott(values, min, max) {
    // Calculate standard deviation manually
    const mean = values.reduce((a, b) => a + b) / values.length;
    const deviation = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    const h = 3.5 * deviation * Math.pow(values.length, -1/3);
    
    // Add safeguards
    if (!h || h <= 0) return thresholdSturges(values, min, max);
    
    let binCount = Math.ceil((max - min) / h);
    binCount = Math.min(binCount, 50); // Limit to 50 bins
    
    const step = (max - min) / binCount;
    const thresholds = [];
    for (let i = 1; i < binCount; i++) {
        thresholds.push(min + i * step);
    }
    return thresholds;
}

function thresholdFreedmanDiaconis(values, min, max) {
    // Calculate quartiles manually
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const iqr = sorted[q3Index] - sorted[q1Index];
    
    const h = 2 * iqr * Math.pow(values.length, -1/3);
    
    // Add safeguards
    if (!h || h <= 0) return thresholdSturges(values, min, max);
    
    let binCount = Math.ceil((max - min) / h);
    binCount = Math.min(binCount, 50); // Limit to 50 bins
    
    const step = (max - min) / binCount;
    const thresholds = [];
    for (let i = 1; i < binCount; i++) {
        thresholds.push(min + i * step);
    }
    return thresholds;
}

function getBinThresholds(values, min, max) {
    try {
        switch (histBinFunction) {
            case "sturges":
                return thresholdSturges(values, min, max);
            case "scott":
                return thresholdScott(values, min, max);
            case "freedmanDiaconis":
                return thresholdFreedmanDiaconis(values, min, max);
            default:
                return thresholdSturges(values, min, max);
        }
    } catch (error) {
        console.warn("Error in bin calculation, falling back to Sturges:", error);
        return thresholdSturges(values, min, max);
    }
}

function updateRangeText(cell, minRange, maxRange, localminRange, localmaxRange) {
    // Update global range text
    const globalMinText = cell.querySelector('text.global-min-range');
    const globalMaxText = cell.querySelector('text.global-max-range');
    
    globalMinText.textContent = Number.isInteger(minRange) ? minRange : minRange.toFixed(1);
    globalMaxText.textContent = Number.isInteger(maxRange) ? maxRange : maxRange.toFixed(1);

    const textWidth = globalMaxText.getBBox().width;
    globalMaxText.setAttribute('x', 100 - textWidth);

    // Calculate scale manually
    const scale = (value) => (value - minRange) / (maxRange - minRange) * 100;

    // Update local range text
    const minText = cell.querySelector('text.min-range');
    const maxText = cell.querySelector('text.max-range');
    
    minText.textContent = Number.isInteger(localminRange) ? localminRange : localminRange.toFixed(1);
    maxText.textContent = Number.isInteger(localmaxRange) ? localmaxRange : localmaxRange.toFixed(1);

    const xMin = Math.max(0, Math.min(100 - textWidth, scale(localminRange)));
    const xMax = Math.max(0, Math.min(100 - textWidth, scale(localmaxRange)));

    minText.setAttribute('x', xMin);
    maxText.setAttribute('x', xMax);

    // Bring text elements to front
    [globalMinText, globalMaxText, minText, maxText].forEach(text => {
        text.parentNode.appendChild(text);
    });
}

function updateScoreRangeText(cell, minRange, maxRange, localminRange, localmaxRange) {
    // Update global range text
    const globalMinText = cell.querySelector('text.global-min-range');
    const globalMaxText = cell.querySelector('text.global-max-range');
    
    globalMinText.textContent = Number.isInteger(minRange) ? minRange : Math.floor(minRange * 10) / 10;
    globalMaxText.textContent = Number.isInteger(maxRange) ? maxRange : Math.floor(maxRange * 10) / 10;

    const textWidth = globalMaxText.getBBox().width;
    const xMinPos = Math.max(0, Math.min(100 - textWidth, Math.floor(minRange * 100)));
    const xMaxPos = Math.max(0, Math.min(100 - textWidth, Math.floor(maxRange * 100)));

    globalMinText.setAttribute('x', xMinPos);
    globalMaxText.setAttribute('x', xMaxPos);

    // Calculate scale manually
    const scale = (value) => (value - minRange) / (maxRange - minRange) * 100;

    // Update local range text
    const minText = cell.querySelector('text.min-range');
    const maxText = cell.querySelector('text.max-range');
    
    minText.textContent = Number.isInteger(localminRange) ? localminRange : Math.floor(localminRange * 10) / 10;
    maxText.textContent = Number.isInteger(localmaxRange) ? localmaxRange : Math.floor(localmaxRange * 10) / 10;

    const xMin = Math.max(0, Math.min(100 - textWidth, scale(localminRange)));
    const xMax = Math.max(0, Math.min(100 - textWidth, scale(localmaxRange)));

    minText.setAttribute('x', xMin);
    maxText.setAttribute('x', xMax);

    // Bring text elements to front
    [globalMinText, globalMaxText, minText, maxText].forEach(text => {
        text.parentNode.appendChild(text);
    });
}

function updateHistogram(table) {
    if (!activateHistograms) {
        const row = document.getElementById("histogramRow" + table.index);
        if (row) row.remove();
        return;
    }

    // Remove existing histograms
    const existingRow = document.getElementById("histogramRow" + table.index);
    if (existingRow) existingRow.remove();
    
    // Create new histograms
    createHistograms(table);
} 