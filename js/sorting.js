function sortTable(column, header, table) {
    // Reset other headers
    const allHeaders = table.dataThead.getElementsByTagName('th');
    for (let h of allHeaders) {
        if (h !== header) {
            h.classList.remove('asc', 'desc');
        }
    }

    // Update sort order
    if (table.sortColumn === column) {
        table.sortOrder = (table.sortOrder + 1) % 3;
    } else {
        table.sortColumn = column;
        table.sortOrder = 1;
    }

    // Update header classes
    header.classList.remove('asc', 'desc');
    if (table.sortOrder === 1) {
        header.classList.add('asc');
    } else if (table.sortOrder === 2) {
        header.classList.add('desc');
    }

    // Sort data
    if (table.sortOrder === 0) {
        // Reset to original order
        table.data.sort((a, b) => {
            return table.data.indexOf(a) - table.data.indexOf(b);
        });
    } else {
        table.data.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // Handle numeric values
            if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }

            // Handle categorical values
            if (categoricalMappings[column]) {
                valA = categoricalMappings[column][valA] || 0;
                valB = categoricalMappings[column][valB] || 0;
            }

            // Compare values
            if (valA < valB) return table.sortOrder === 1 ? -1 : 1;
            if (valA > valB) return table.sortOrder === 1 ? 1 : -1;
            return 0;
        });
    }

    // Update table display
    updateTableDisplay(table);
}

function updateTableDisplay(table) {
    // Clear existing rows
    while (table.dataTbody.firstChild) {
        table.dataTbody.removeChild(table.dataTbody.firstChild);
    }

    // Create new rows
    table.data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'rows' + table.index;

        // Create cells
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

    // Update colors and means
    updateColors(table);
    calculateColumnMeans(table);
}

function updateSort(table) {
    // Reset header texts
    const headers = table.dataThead.getElementsByTagName('th');
    Array.from(headers).forEach(header => {
        header.textContent = header.dataset.column || header.textContent.split(' ')[0];
    });

    if (!table.sortColumn) return;

    // Find the header for the sorted column
    const header = Array.from(headers)
        .find(h => h.textContent === table.sortColumn);
    
    if (!header) return;

    if (table.sortOrder === 1) {
        // Sort descending
        table.data.sort((a, b) => {
            if (a[table.sortColumn] > b[table.sortColumn]) return -1;
            if (a[table.sortColumn] < b[table.sortColumn]) return 1;
            return 0;
        });
        header.textContent += ' ▼';
    } else if (table.sortOrder === 2) {
        // Sort ascending
        table.data.sort((a, b) => {
            if (a[table.sortColumn] < b[table.sortColumn]) return -1;
            if (a[table.sortColumn] > b[table.sortColumn]) return 1;
            return 0;
        });
        header.textContent += ' ▲';
    } else {
        // Reset to original order
        table.data.sort((a, b) => {
            return table.data.indexOf(a) - table.data.indexOf(b);
        });
    }

    // Update table display
    updateTableDisplay(table);
}

function sortScore(table) {
    if (table.sortOrder === 1) {
        // Sort descending
        table.data.sort((a, b) => {
            const scoreA = parseFloat(a["Score"]) || 0;
            const scoreB = parseFloat(b["Score"]) || 0;
            return scoreB - scoreA;
        });
    } else if (table.sortOrder === 2) {
        // Sort ascending
        table.data.sort((a, b) => {
            const scoreA = parseFloat(a["Score"]) || 0;
            const scoreB = parseFloat(b["Score"]) || 0;
            return scoreA - scoreB;
        });
    } else {
        // Reset to original order
        table.data.sort((a, b) => {
            return table.data.indexOf(a) - table.data.indexOf(b);
        });
    }

    // Update table display
    updateTableDisplay(table);
} 