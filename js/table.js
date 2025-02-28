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
    
    document.body.appendChild(table.mydiv);

    createTableHeader(table);
    createTableBody(table);
    setupDragAndResize(table);
    
    // Set initial resize mode
    table.resizeMode = 'full';
    
    // Create initial histograms
    if (activateHistograms) {
        createHistograms(table);
    }
    
    updateScores(table);
    updateColors(table);
    calculateColumnMeans(table);
    
    // Initialize histogram height measurement
    if (!table.histogramHeight) {
        measureHistogramHeight(table);
    }
    
    // Calculate minimum size based on content
    const minSize = calculateMinimumTableSize(table);
    
    // Set initial dimensions based on minimum size with some padding
    table.mydiv.style.width = (minSize.width + 50) + 'px';
    
    // Apply initial resize to ensure correct dimensions
    updateResize(table);
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
    bothResizeBtn.id = 'resize-full' + table.index;
    bothResizeBtn.classList.add('active');
    bothResizeBtn.onclick = function() {
        // If already in 'full' mode, reset the table size to show all content
        if (table.resizeMode === 'full') {
            // Calculate proper dimensions
            const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
            const naturalHeight = getScrollHeight(table.dataTable);
            const minSize = calculateMinimumTableSize(table);
            
            // Reset table to show full content
            const fullTableHeight = Math.max(naturalHeight + mydivHeaderHeight, minSize.height);
            setTableHeights(table, fullTableHeight, 'full');
            
            // Also reset width to properly fit content
            table.mydiv.style.width = Math.max(minSize.width, getScrollWidth(table.dataTable)) + 'px';
        } else {
            // Switch to 'full' mode
            table.resizeMode = 'full';
            table.dataTable.style.display = null;
            table.dataTable.style.overflow = null;
            updateResize(table);
        }
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
    // Create resizing handles for all edges and corners
    const handlePositions = [
        { position: 'n', cursor: 'ns-resize', left: '50%', top: '0', right: 'auto', bottom: 'auto', width: '10px', height: '5px', transform: 'translateX(-50%)' },
        { position: 'e', cursor: 'ew-resize', left: 'auto', top: '50%', right: '0', bottom: 'auto', width: '5px', height: '10px', transform: 'translateY(-50%)' },
        { position: 's', cursor: 'ns-resize', left: '50%', top: 'auto', right: 'auto', bottom: '0', width: '10px', height: '5px', transform: 'translateX(-50%)' },
        { position: 'w', cursor: 'ew-resize', left: '0', top: '50%', right: 'auto', bottom: 'auto', width: '5px', height: '10px', transform: 'translateY(-50%)' },
        { position: 'ne', cursor: 'ne-resize', left: 'auto', top: '0', right: '0', bottom: 'auto', width: '10px', height: '10px', transform: 'none' },
        { position: 'se', cursor: 'se-resize', left: 'auto', top: 'auto', right: '0', bottom: '0', width: '10px', height: '10px', transform: 'none' },
        { position: 'sw', cursor: 'sw-resize', left: '0', top: 'auto', right: 'auto', bottom: '0', width: '10px', height: '10px', transform: 'none' },
        { position: 'nw', cursor: 'nw-resize', left: '0', top: '0', right: 'auto', bottom: 'auto', width: '10px', height: '10px', transform: 'none' }
    ];
    
    // Create and attach all resize handles
    table.resizers = {};
    
    handlePositions.forEach(handle => {
        const resizer = document.createElement('div');
        resizer.id = `resizer-${handle.position}-${table.index}`;
        resizer.className = `resizer resizer-${handle.position}`;
        resizer.style.position = 'absolute';
        resizer.style.cursor = handle.cursor;
        resizer.style.background = 'transparent';
        resizer.style.zIndex = '10';
        
        // Set position
        resizer.style.left = handle.left;
        resizer.style.top = handle.top;
        resizer.style.right = handle.right;
        resizer.style.bottom = handle.bottom;
        resizer.style.width = handle.width;
        resizer.style.height = handle.height;
        
        if (handle.transform) {
            resizer.style.transform = handle.transform;
        }
        
        table.mydiv.appendChild(resizer);
        table.resizers[handle.position] = resizer;
    });
    
    // Store the main resizer (se) for backward compatibility
    table.resizer = table.resizers.se;
    
    // Setup resize functionality
    enableResize(table);

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
    // For backward compatibility, ensure resizers object exists
    if (!table.resizers) {
        table.resizers = { se: table.resizer };
    }
    
    // Iterate through all resizers and attach event listeners
    Object.entries(table.resizers).forEach(([position, resizer]) => {
        // Set cursor based on position
        resizer.style.cursor = position.includes('n') ? (position.includes('e') ? 'ne-resize' : position.includes('w') ? 'nw-resize' : 'ns-resize') :
                              position.includes('s') ? (position.includes('e') ? 'se-resize' : position.includes('w') ? 'sw-resize' : 'ns-resize') :
                              position.includes('e') || position.includes('w') ? 'ew-resize' : 'se-resize';
        
        // Remove any existing event listeners by cloning and replacing
        const oldResizer = resizer;
        const newResizer = oldResizer.cloneNode(true);
        oldResizer.parentNode.replaceChild(newResizer, oldResizer);
        table.resizers[position] = newResizer;
        
        if (position === 'se') {
            table.resizer = newResizer; // Update the main resizer reference
        }
        
        // Add the resize event listener
        newResizer.addEventListener('mousedown', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Store starting values
            startX = event.clientX;
            startY = event.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(table.mydiv).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(table.mydiv).height, 10);
            const startLeft = parseInt(document.defaultView.getComputedStyle(table.mydiv).left, 10);
            const startTop = parseInt(document.defaultView.getComputedStyle(table.mydiv).top, 10);
            
            // Create a resize function specific to this handle's position
            currentResizeFunction = function(e) {
                doResizeWithPosition(e, table, position, startWidth, startHeight, startLeft, startTop);
            };
            
            // Add event listeners for mouse movement and release
            document.documentElement.addEventListener('mousemove', currentResizeFunction, false);
            document.documentElement.addEventListener('mouseup', stopResize, false);
        });
    });
}

function disableResize(table) {
    // For backward compatibility
    if (!table.resizers) {
        table.resizers = { se: table.resizer };
    }
    
    // Disable all resizers
    Object.entries(table.resizers).forEach(([position, resizer]) => {
        resizer.style.cursor = 'default';
        
        // Clone and replace to remove all event listeners
        const oldResizer = resizer;
        const newResizer = oldResizer.cloneNode(true);
        oldResizer.parentNode.replaceChild(newResizer, oldResizer);
        table.resizers[position] = newResizer;
        
        if (position === 'se') {
            table.resizer = newResizer; // Update the main resizer reference
        }
    });
    
    // Make sure any ongoing resize operation is stopped
    if (currentResizeFunction) {
        stopResize();
    }
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