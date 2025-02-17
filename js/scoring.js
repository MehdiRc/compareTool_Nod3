function resetScoreMinMax() {
    globalMin.Score = undefined;
    globalMax.Score = undefined;
}

function updateScores(table) {
    // Skip if scores are not activated
    if (!activateScores) {
        table.dataTbody.querySelectorAll('td').forEach(cell => {
            if (cell.dataset.column === "Score") {
                cell.querySelector('.cell-label').textContent = 'X';
            }
        });
        return;
    }

    // Calculate scores for each row
    table.data.forEach((row, rowIndex) => {
        let totalScore = 0;
        let totalWeight = 0;

        // Calculate weighted score for each column
        table.keys.forEach(column => {
            if (!includedColumns[column]) return;

            const value = row[column];
            let score;

            if (!isNaN(parseFloat(value))) {
                // Numeric values
                const numericValue = parseFloat(value);
                const distance = Math.abs(numericValue - idealValues[column]);
                const maxDistance = Math.max(
                    Math.abs(globalMax[column] - idealValues[column]),
                    Math.abs(globalMin[column] - idealValues[column])
                );
                score = maxDistance !== 0 ? 1 - (distance / maxDistance) : 1;
            } else if (categoricalMappings[column]?.[value] !== undefined) {
                // Categorical values
                const mappedValue = categoricalMappings[column][value];
                const distance = Math.abs(mappedValue - 100);
                const maxDistance = 200;
                score = 1 - (distance / maxDistance);
            } else {
                return; // Skip invalid values
            }

            totalScore += score * priorities[column];
            totalWeight += priorities[column];
        });

        // Calculate final score
        row.Score = totalWeight > 0 ? totalScore / totalWeight : 0;

        // Update score display in table
        const rows = table.dataTbody.getElementsByTagName('tr');
        const currentRow = rows[rowIndex];
        if (currentRow) {
            const scoreCell = currentRow.querySelector('td[data-column="Score"]');
            if (scoreCell) {
                scoreCell.dataset.value = row.Score;
                scoreCell.querySelector('.cell-label').textContent = row.Score.toFixed(2);
            }
        }
    });

    // Update global min/max scores
    const scores = table.data.map(row => row.Score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    if (globalMin.Score === undefined || minScore < globalMin.Score) {
        globalMin.Score = minScore;
    }
    if (globalMax.Score === undefined || maxScore > globalMax.Score) {
        globalMax.Score = maxScore;
    }

    // Update table min/max scores
    table.minVal.Score = minScore;
    table.maxVal.Score = maxScore;

    // Update colors and histograms
    updateColors(table);
    if (activateHistograms) {
        updateHistogram(table);
    }
}

function updateColumnState(tableList) {
    const column = this.name;
    includedColumns[column] = this.checked;

    // Update slider states
    const sliderTable = document.getElementById('sliderTable');
    const rows = sliderTable.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        Array.from(cells).forEach(cell => {
            const inputs = cell.getElementsByTagName('input');
            Array.from(inputs).forEach(input => {
                if (input.name === column) {
                    input.classList.toggle('disabled', !includedColumns[column]);
                }
            });
        });
    });

    resetScoreMinMax();
    
    tableList.forEach(table => {
        updateScores(table);
        updateColors(table);
    });
} 