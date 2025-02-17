function createDataTable(table) {
    // Create main container
    table.mydiv = document.createElement('div');
    table.mydiv.id = 'mydiv' + table.index;
    table.mydiv.style.position = 'absolute';
    table.mydiv.style.zIndex = '9';
    table.mydiv.style.backgroundColor = '#f1f1f1';
    table.mydiv.style.border = '1px solid #d3d3d3';
    table.mydiv.style.textAlign = 'center';
    table.mydiv.style.top = table.position.top;
    table.mydiv.style.left = table.position.left;
    
    // Set initial dimensions
    table.mydiv.style.width = '800px';
    table.mydiv.style.height = 'auto';
    document.body.appendChild(table.mydiv);

    createTableHeader(table);
    createTableBody(table);
    setupDragAndResize(table);
    
    // Set initial resize mode
    table.resizeMode = 'both';
    
    // Create initial histograms
    if (activateHistograms) {
        createHistograms(table);
    }
    
    updateScores(table);
    updateColors(table);
    calculateColumnMeans(table);
}

function createTableHeader(table) {
    // Create header
    table.mydivheader = document.createElement('div');
    table.mydivheader.id = 'mydivheader' + table.index;
    table.mydivheader.style.cursor = 'move';
    table.mydivheader.style.backgroundColor = '#2196F3';
    table.mydivheader.style.color = '#fff';
    table.mydivheader.textContent = table.name;
    table.mydiv.appendChild(table.mydivheader);

    addHeaderButtons(table);
}

function addHeaderButtons(table) {
    // Minimize button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.textContent = '🗕';
    minimizeBtn.id = 'hide-table' + table.index;
    minimizeBtn.onclick = function() {
        table.resizeMode = 'hide';
        table.dataTable.style.display = 'none';
        updateResize(table);
    };
    table.mydivheader.appendChild(minimizeBtn);

    // Free resize button
    const freeResizeBtn = document.createElement('button');
    freeResizeBtn.textContent = '⇲';
    freeResizeBtn.id = 'resize-free' + table.index;
    freeResizeBtn.onclick = function() {
        table.resizeMode = 'free';
        table.dataTable.style.display = null;
        table.dataTable.style.overflow = 'auto';
        updateResize(table);
    };
    table.mydivheader.appendChild(freeResizeBtn);

    // Both dimensions resize button
    const bothResizeBtn = document.createElement('button');
    bothResizeBtn.textContent = '⛶';
    bothResizeBtn.id = 'resize-both' + table.index;
    bothResizeBtn.classList.add('active');
    bothResizeBtn.onclick = function() {
        table.resizeMode = 'both';
        table.dataTable.style.display = null;
        table.dataTable.style.overflow = null;
        updateResize(table);
    };
    table.mydivheader.appendChild(bothResizeBtn);

    // Pin button
    const pinBtn = document.createElement('button');
    pinBtn.textContent = table.pin ? '📍' : '📌';
    pinBtn.id = 'pin-table' + table.index;
    pinBtn.style.float = 'right';
    pinBtn.onclick = () => toggleTablePin(table);
    table.mydivheader.appendChild(pinBtn);
}

function createTableBody(table) {
    // Create scrollable container
    table.scrolldiv = document.createElement('div');
    table.scrolldiv.id = 'dataTableScroll' + table.index;
    table.scrolldiv.style.overflow = 'auto';
    table.scrolldiv.style.maxHeight = '400px'; // Add max height
    table.mydiv.appendChild(table.scrolldiv);

    // Create table
    table.dataTable = document.createElement('table');
    table.dataTable.id = 'dataTable' + table.index;
    table.dataTable.className = 'mapping-table';
    table.scrolldiv.appendChild(table.dataTable);

    // Create thead
    table.dataThead = document.createElement('thead');
    table.dataTable.appendChild(table.dataThead);

    // Create header row
    const headerRow = document.createElement('tr');
    table.dataThead.appendChild(headerRow);

    // Create headers
    const headers = table.keys.concat(['Score']);
    table.headers = headers.map((columnName, i) => {
        const th = document.createElement('th');
        th.textContent = columnName;
        th.className = 'headers' + table.index;
        th.onclick = function(event) {
            if (!event.defaultPrevented) {
                sortTable(columnName, th, table);
            }
            event.preventDefault();
        };
        headerRow.appendChild(th);
        return th;
    });

    // Set container for histograms
    table.container = table.dataThead;

    // Create tbody
    table.dataTbody = document.createElement('tbody');
    table.dataTable.appendChild(table.dataTbody);
    createTableRows(table);
}

function setupDragAndResize(table) {
    // Add resizer
    table.resizer = document.createElement('div');
    table.resizer.id = 'resizer' + table.index;
    table.resizer.style.width = '10px';
    table.resizer.style.height = '10px';
    table.resizer.style.backgroundColor = 'black';
    table.resizer.style.position = 'absolute';
    table.resizer.style.right = '0';
    table.resizer.style.bottom = '0';
    table.resizer.style.cursor = 'se-resize';
    table.mydiv.appendChild(table.resizer);

    // Setup resize functionality
    table.resizer.addEventListener('mousedown', function(event) {
        event.preventDefault();
        startX = event.clientX;
        startY = event.clientY;
        startWidth = parseInt(table.mydiv.style.width, 10);
        startHeight = parseInt(table.mydiv.style.height, 10);

        currentResizeFunction = function(e) { doResize(e, table); };
        document.documentElement.addEventListener('mousemove', currentResizeFunction, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);
    });

    // Setup drag functionality
    dragElement(table.mydiv, 'mydivheader' + table.index, table);
}

function toggleTablePin(table) {
    table.pin = !table.pin;
    const button = document.getElementById('pin-table' + table.index);
    
    if (!table.pin) {
        button.textContent = '📌';
        table.mydivheader.style.cursor = 'move';
        table.mydivheader.style.backgroundColor = '#2196F3';
        dragElement(table.mydiv, 'mydivheader' + table.index, table);
        enableResize(table);
    } else {
        button.textContent = '📍';
        table.mydivheader.style.backgroundColor = '#808080';
        table.mydivheader.style.cursor = 'default';
        disableDragElement(table.mydiv, 'mydivheader' + table.index);
        disableResize(table);
    }
}

function enableResize(table) {
    table.resizer.style.cursor = 'se-resize';
    table.resizer.addEventListener('mousedown', function(event) {
        event.preventDefault();
        startX = event.clientX;
        startY = event.clientY;
        startWidth = parseInt(table.mydiv.style.width, 10);
        startHeight = parseInt(table.mydiv.style.height, 10);

        currentResizeFunction = function(e) { doResize(e, table); };
        document.documentElement.addEventListener('mousemove', currentResizeFunction, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);
    });
}

function disableResize(table) {
    table.resizer.style.cursor = 'default';
    table.resizer.removeEventListener('mousedown', currentResizeFunction);
}

function createTableRows(table) {
    // Create new rows
    table.data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'rows' + table.index;

        // Create cells for regular columns
        table.keys.forEach(column => {
            const td = document.createElement('td');
            td.className = 'table-cell cells' + table.index;
            td.dataset.column = column;
            td.dataset.value = row[column];

            // Create cell label
            const label = document.createElement('div');
            label.className = 'cell-label';
            label.textContent = row[column];
            td.appendChild(label);

            // Create progress bar
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            td.appendChild(progressBar);

            tr.appendChild(td);
        });

        // Add Score cell
        const scoreCell = document.createElement('td');
        scoreCell.className = 'table-cell cells' + table.index;
        scoreCell.dataset.column = 'Score';
        scoreCell.dataset.value = row.Score || 0;

        const scoreLabel = document.createElement('div');
        scoreLabel.className = 'cell-label';
        scoreLabel.textContent = activateScores ? (row.Score || 0).toFixed(2) : 'X';
        scoreCell.appendChild(scoreLabel);

        const scoreBar = document.createElement('div');
        scoreBar.className = 'progress-bar';
        scoreCell.appendChild(scoreBar);

        tr.appendChild(scoreCell);

        table.dataTbody.appendChild(tr);
    });
}

function calculateColumnMeans(table) {
    table.columnMeans = {};

    // Calculate means for each column
    table.keys.forEach(function(column) {
        let sum = 0;
        let count = 0;
        table.data.forEach(function(row) {
            const value = row[column];
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                sum += parseFloat(value);
                count++;
            } else if (categoricalMappings[column]?.[value] !== undefined) {
                sum += categoricalMappings[column][value];
                count++;
            }
        });
        table.columnMeans[column] = count > 0 ? (sum / count).toFixed(2) : "N/A";
    });

    // Calculate Score mean
    if (table.data[0].Score !== undefined) {
        const scoreSum = table.data.reduce((sum, row) => sum + (parseFloat(row.Score) || 0), 0);
        table.columnMeans["Score"] = (scoreSum / table.data.length).toFixed(2);
    }

    // Remove existing mean row
    const meanRows = Array.from(table.dataTbody.getElementsByTagName('tr'))
        .filter(tr => tr.classList.contains('mean-row'));
    meanRows.forEach(tr => tr.remove());

    // Add new mean row
    const meanRow = document.createElement('tr');
    meanRow.className = 'mean-row';
    table.dataTbody.appendChild(meanRow);

    // Add cells for each column mean
    table.keys.forEach((column, i) => {
        const td = document.createElement('td');
        td.className = 'table-cell';
        td.dataset.column = column;
        td.dataset.value = table.columnMeans[column];

        // Create cell label
        const label = document.createElement('div');
        label.className = 'cell-label';
        label.textContent = table.columnMeans[column];
        td.appendChild(label);

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        if (includedColumns[column]) {
            // Set initial width to 100% to match other cells
            progressBar.style.width = '100%';
            // Set initial background color
            if (activateColors) {
                const meanValue = parseFloat(table.columnMeans[column]);
                if (!isNaN(meanValue)) {
                    const distance = Math.abs(meanValue - idealValues[column]);
                    const maxDistance = Math.max(
                        Math.abs(globalMax[column] - idealValues[column]),
                        Math.abs(globalMin[column] - idealValues[column])
                    );
                    progressBar.style.backgroundColor = colorScale(maxDistance !== 0 ? 
                        1 - distance / maxDistance : 0);
                }
            }
        }
        td.appendChild(progressBar);

        meanRow.appendChild(td);
    });

    // Add Score cell
    const scoreCell = document.createElement('td');
    scoreCell.className = 'table-cell score';
    scoreCell.dataset.column = 'Score';
    scoreCell.dataset.value = table.columnMeans["Score"];

    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'cell-label';
    scoreLabel.textContent = table.columnMeans["Score"];
    scoreCell.appendChild(scoreLabel);

    const scoreBar = document.createElement('div');
    scoreBar.className = 'progress-bar';
    scoreBar.style.width = '100%';
    if (activateColors) {
        const meanScore = parseFloat(table.columnMeans["Score"]);
        if (!isNaN(meanScore)) {
            scoreBar.style.backgroundColor = colorScale(meanScore);
        }
    }
    scoreCell.appendChild(scoreBar);

    meanRow.appendChild(scoreCell);

    // Update colors and bars for the mean row
    updateColors(table);
}

function updateAllTables() {
    resetScoreMinMax();
    tableList.forEach(table => {
        updateScores(table);
        updateColors(table);
        updateHistogram(table);
    });
}

// Additional helper functions... 