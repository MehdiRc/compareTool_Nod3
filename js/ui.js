function createUI() {
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.marginBottom = '10px';
    document.body.appendChild(buttonContainer);

    // Move CSV file input to container
    const csvInput = document.getElementById('csvFile');
    csvInput.style.display = 'inline-block';
    buttonContainer.appendChild(csvInput);
    
    // Save state button
    const saveStateBtn = document.createElement('input');
    saveStateBtn.type = 'button';
    saveStateBtn.id = 'saveState';
    saveStateBtn.value = 'Save State 💾';
    saveStateBtn.style.display = restrictedMode ? 'none' : 'inline-block';
    saveStateBtn.addEventListener('click', saveState);
    buttonContainer.appendChild(saveStateBtn);

    // Load state button and label
    const loadStateLabel = document.createElement('label');
    loadStateLabel.htmlFor = 'loadState';
    loadStateLabel.textContent = 'Load State ⮰';
    loadStateLabel.style.display = 'inline-block';
    loadStateLabel.style.padding = '1px 5px';
    loadStateLabel.style.fontSize = '16px';
    loadStateLabel.style.cursor = 'pointer';
    loadStateLabel.style.backgroundColor = '#4CAF50';
    loadStateLabel.style.color = 'white';
    loadStateLabel.style.border = 'none';
    loadStateLabel.style.textAlign = 'center';
    loadStateLabel.style.textDecoration = 'none';
    loadStateLabel.style.display = restrictedMode ? 'none' : 'inline-block';
    loadStateLabel.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#45a049';
    });
    loadStateLabel.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#4CAF50';
    });
    buttonContainer.appendChild(loadStateLabel);

    // Hidden file input for load state
    const loadStateInput = document.createElement('input');
    loadStateInput.type = 'file';
    loadStateInput.id = 'loadState';
    loadStateInput.accept = '.json';
    loadStateInput.multiple = null;
    loadStateInput.style.display = 'none';
    loadStateInput.addEventListener('change', function(event) {
        handleStateLoad(event);
    });
    buttonContainer.appendChild(loadStateInput);

    // Settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.className = 'collapsible';
    settingsBtn.textContent = '▼ Open Settings';
    settingsBtn.style.display = restrictedMode ? 'none' : 'block';
    settingsBtn.addEventListener('click', toggleSettings);
    document.body.appendChild(settingsBtn);

    // Settings content
    const content = document.createElement('div');
    content.className = 'content';
    content.style.display = 'block';
    document.body.appendChild(content);

    addSettingsControls(content);
    createSliderTable();
}

function updateUI() {
    // Update checkboxes
    document.getElementById('activateHistograms').checked = activateHistograms;
    document.getElementById('activatePriority').checked = activatePriority;
    document.getElementById('activateTOffPriorityMode').checked = activateTOffPriorityMode;
    document.getElementById('activateScores').checked = activateScores;
    document.getElementById('activateColors').checked = activateColors;
    document.getElementById('activateBars').checked = activateBars;
    document.getElementById('activateOpacity').checked = activateOpacity;

    // Update dropdowns
    document.querySelector('[name="colorMetricSelect"]').value = colorMetric;
    document.querySelector('[name="barsMetricSelect"]').value = barsMetric;
    document.querySelector('[name="opacityMetricSelect"]').value = opacityMetric;
    document.querySelector('[name="histBinFunction"]').value = histBinFunction;

    // Update slider table
    updateSliderTable();
}

// Additional UI helper functions... 