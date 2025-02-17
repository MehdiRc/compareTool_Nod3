function toggleSettings() {
    this.classList.toggle("active");
    const content = this.nextElementSibling;
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        content.style.display = "none";
        this.textContent = "▼ Open Settings";
    } else {
        content.style.display = "block";
        content.style.maxHeight = content.scrollHeight + "px";
        this.textContent = "▲ Close Settings";
    }
}

function addSettingsControls(content) {
    // Create settings grid
    const settingsGrid = document.createElement('div');
    settingsGrid.className = 'settings-grid';
    content.appendChild(settingsGrid);

    // Visualization Controls
    const visualControls = document.createElement('div');
    visualControls.className = 'settings-section';
    settingsGrid.appendChild(visualControls);

    const visualTitle = document.createElement('h3');
    visualTitle.textContent = 'Visualization Controls';
    visualControls.appendChild(visualTitle);

    // Histograms
    addCheckbox(visualControls, "activateHistograms", "Activate Histograms", 
        checked => {
            activateHistograms = checked;
            if (!checked) {
                tableList.forEach(table => {
                    const histRow = document.getElementById("histogramRow" + table.index);
                    if (histRow) histRow.remove();
                });
            } else {
                tableList.forEach(createHistograms);
            }
        }, activateHistograms);

    // Colors
    addCheckbox(visualControls, "activateColors", "Activate Colors",
        checked => {
            activateColors = checked;
            tableList.forEach(updateColors);
        }, activateColors);

    // Bars
    addCheckbox(visualControls, "activateBars", "Activate Bars",
        checked => {
            activateBars = checked;
            tableList.forEach(updateColors);
        }, activateBars);

    // Opacity
    addCheckbox(visualControls, "activateOpacity", "Activate Opacity",
        checked => {
            activateOpacity = checked;
            tableList.forEach(updateColors);
        }, activateOpacity);

    // Metric Controls
    const metricControls = document.createElement('div');
    metricControls.className = 'settings-section';
    settingsGrid.appendChild(metricControls);

    const metricTitle = document.createElement('h3');
    metricTitle.textContent = 'Metric Controls';
    metricControls.appendChild(metricTitle);

    // Color Metric
    addMetricDropdown(metricControls, "colorMetric", "Color Metric", value => {
        colorMetric = value;
        tableList.forEach(updateColors);
    }, colorMetric);

    // Bars Metric
    addMetricDropdown(metricControls, "barsMetric", "Bars Metric", value => {
        barsMetric = value;
        tableList.forEach(updateColors);
    }, barsMetric);

    // Opacity Metric
    addMetricDropdown(metricControls, "opacityMetric", "Opacity Metric", value => {
        opacityMetric = value;
        tableList.forEach(updateColors);
    }, opacityMetric);

    // Priority Controls
    const priorityControls = document.createElement('div');
    priorityControls.className = 'settings-section';
    settingsGrid.appendChild(priorityControls);

    const priorityTitle = document.createElement('h3');
    priorityTitle.textContent = 'Priority Controls';
    priorityControls.appendChild(priorityTitle);

    // Priority
    addCheckbox(priorityControls, "activatePriority", "Activate Priority",
        checked => {
            activatePriority = checked;
            tableList.forEach(updateColors);
        }, activatePriority);

    // Priority Normalization
    addCheckbox(priorityControls, "activateTOffPriorityMode", "Activate priority normalization",
        checked => {
            activateTOffPriorityMode = checked;
        }, activateTOffPriorityMode);

    // Scores
    addCheckbox(priorityControls, "activateScores", "Activate Scores",
        checked => {
            activateScores = checked;
            resetScoreMinMax();
            tableList.forEach(table => {
                updateScores(table);
                updateHistogram(table);
            });
        }, activateScores);

    // Histogram Controls
    const histogramControls = document.createElement('div');
    histogramControls.className = 'settings-section';
    settingsGrid.appendChild(histogramControls);

    const histogramTitle = document.createElement('h3');
    histogramTitle.textContent = 'Histogram Controls';
    histogramControls.appendChild(histogramTitle);

    // Binning Function
    addBinningDropdown(histogramControls, histBinFunction);
}

function addCheckbox(container, id, label, onChange, initialState = true) {
    const div = document.createElement('div');
    div.style.margin = '5px 0';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.name = id;
    input.checked = initialState;
    input.addEventListener('change', function() {
        onChange(this.checked);
    });
    div.appendChild(input);

    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    labelElement.style.marginLeft = '5px';
    div.appendChild(labelElement);

    container.appendChild(div);
}

function addMetricDropdown(container, id, label, onChange, initialValue = "Distance") {
    const div = document.createElement('div');
    div.style.margin = '5px 0';

    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    labelElement.style.display = 'block';
    div.appendChild(labelElement);

    const select = document.createElement('select');
    select.name = id + "Select";
    select.style.width = '100%';
    select.style.marginTop = '2px';
    select.addEventListener('change', function() {
        onChange(this.value);
    });

    const options = ["Distance", "Priority", "DistanceXPriority"];
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option === "Distance" ? "Distance from ideal" : option;
        optionElement.selected = option === initialValue;
        select.appendChild(optionElement);
    });

    div.appendChild(select);
    container.appendChild(div);
}

function addBinningDropdown(container, initialValue = "sturges") {
    const div = document.createElement('div');
    div.style.margin = '5px 0';

    const label = document.createElement('label');
    label.htmlFor = 'histBinFunction';
    label.textContent = 'Histogram Binning Function';
    label.style.display = 'block';
    div.appendChild(label);

    const select = document.createElement('select');
    select.name = 'histBinFunction';
    select.style.width = '100%';
    select.style.marginTop = '2px';
    select.addEventListener('change', function() {
        histBinFunction = this.value;
        tableList.forEach(table => {
            const histRow = document.getElementById("histogramRow" + table.index);
            if (histRow) histRow.remove();
            createHistograms(table);
        });
    });

    const options = ["sturges", "scott", "freedmanDiaconis"];
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option.charAt(0).toUpperCase() + option.slice(1);
        optionElement.selected = option === initialValue;
        select.appendChild(optionElement);
    });

    div.appendChild(select);
    container.appendChild(div);
}

function updateUI() {
    // Update checkboxes
    document.getElementById("activateHistograms").checked = activateHistograms;
    document.getElementById("activatePriority").checked = activatePriority;
    document.getElementById("activateTOffPriorityMode").checked = activateTOffPriorityMode;
    document.getElementById("activateScores").checked = activateScores;
    document.getElementById("activateColors").checked = activateColors;
    document.getElementById("activateBars").checked = activateBars;
    document.getElementById("activateOpacity").checked = activateOpacity;

    // Update dropdowns
    document.getElementById("colorMetricSelect").value = colorMetric;
    document.getElementById("barsMetricSelect").value = barsMetric;
    document.getElementById("opacityMetricSelect").value = opacityMetric;
    document.getElementById("histBinFunction").value = histBinFunction;

    // Update slider table
    updateSliderTable();
} 