// Global resize variables
let startX, startY, startWidth, startHeight;
let currentResizeFunction = null;

// Initialize max z-index for proper layering
let maxZIndex = 9;

// Default row and column sizes are now defined in utils.js

function setStyle(element, property, value) {
    if (element instanceof HTMLElement) {
        element.style[property] = value;
    } else if (element.node && element.node() instanceof HTMLElement) {
        // Handle d3 selections during transition period
        element.node().style[property] = value;
    }
    return element;
}

function getOffsetHeight(element) {
    return element instanceof HTMLElement ? element.offsetHeight : element.node().offsetHeight;
}

function getOffsetWidth(element) {
    return element instanceof HTMLElement ? element.offsetWidth : element.node().offsetWidth;
}

function getOffsetLeft(element) {
    return element instanceof HTMLElement ? element.offsetLeft : element.node().offsetLeft;
}

function getOffsetTop(element) {
    return element instanceof HTMLElement ? element.offsetTop : element.node().offsetTop;
}

function getScrollWidth(element) {
    return element instanceof HTMLElement ? element.scrollWidth : element.node().scrollWidth;
}

function getScrollHeight(element) {
    return element instanceof HTMLElement ? element.scrollHeight : element.node().scrollHeight;
}

function getStyle(element, property) {
    if (element instanceof HTMLElement) {
        return getComputedStyle(element)[property];
    } else if (element.style) { // D3 selection
        return element.style(property);
    }
    return null;
}

function getBoundingClientRect(element) {
    if (element instanceof HTMLElement) {
        return element.getBoundingClientRect();
    } else if (element.node) { // D3 selection
        return element.node().getBoundingClientRect();
    }
    return null;
}

function dragElement(element, headerId, table) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(headerId);
    
    if (header) {
        header.onmousedown = (e) => dragMouseDown(table, e);
    } else {
        element.onmousedown = (e) => dragMouseDown(table, e);
    }

    function dragMouseDown(table, e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = (e) => elementDrag(table, e);
        
        // Bring element to front
        const highestZIndex = Math.max(...Array.from(document.querySelectorAll('*'))
            .map(elem => parseFloat(getComputedStyle(elem).zIndex) || 0));
        element.style.zIndex = highestZIndex + 1;
        table.position["z-index"] = highestZIndex + 1;
    }

    function elementDrag(table, e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        
        table.position["top"] = (element.offsetTop - pos2) + "px";
        table.position["left"] = (element.offsetLeft - pos1) + "px";
        
        // Keep table in viewport
        keepInViewport(table);
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        // Final check to ensure table is in viewport
        keepInViewport(table);
    }
}

function disableDragElement(element, headerId) {
    const header = document.getElementById(headerId);
    if (header) {
        header.onmousedown = null;
    } else {
        element.onmousedown = null;
    }
}

function updateResizeButtons(table) {
    // Get all resize buttons
    const hideBtn = document.getElementById('hide-table' + table.index);
    const freeBtn = document.getElementById('resize-free' + table.index);
    const fullBtn = document.getElementById('resize-full' + table.index);

    // Reset all buttons
    [hideBtn, freeBtn, fullBtn].forEach(btn => {
        if (btn) {
            btn.classList.remove('active');
            btn.style.backgroundColor = '';
        }
    });
    
    // Remove full-mode-active class from all tables
    table.mydiv.classList.remove('full-mode-active');

    // Activate the current mode button
    switch (table.resizeMode) {
        case 'hide':
            if (hideBtn) {
                hideBtn.classList.add('active');
                hideBtn.style.backgroundColor = '#555';
            }
            break;
        case 'free':
            if (freeBtn) {
                freeBtn.classList.add('active');
                freeBtn.style.backgroundColor = '#555';
            }
            break;
        case 'full':
            if (fullBtn) {
                fullBtn.classList.add('active');
                fullBtn.style.backgroundColor = '#555';
            }
            // Add full-mode-active class to table
            table.mydiv.classList.add('full-mode-active');
            break;
    }
}

function keepInViewport(table) {
    const rect = getBoundingClientRect(table.mydiv);
    const currentLeft = parseInt(getStyle(table.mydiv, 'left'));
    const currentTop = parseInt(getStyle(table.mydiv, 'top'));
    
    // Check left edge
    if (rect.left < 0) {
        const newLeft = Math.max(0, currentLeft - rect.left);
        setStyle(table.mydiv, 'left', newLeft + 'px');
        table.position.left = newLeft + 'px';
    }
    
    // Check top edge
    if (rect.top < 0) {
        const newTop = Math.max(0, currentTop - rect.top);
        setStyle(table.mydiv, 'top', newTop + 'px');
        table.position.top = newTop + 'px';
    }
}

function doResize(e, table) {
    const scrollSpeed = 10;
    const edgeDistance = 100;

    // Handle scrolling near edges
    if (e.clientY < edgeDistance) window.scrollBy(0, -scrollSpeed);
    if (window.innerHeight - e.clientY < edgeDistance) window.scrollBy(0, scrollSpeed);
    if (e.clientX < edgeDistance) window.scrollBy(-scrollSpeed, 0);
    if (window.innerWidth - e.clientX < edgeDistance) window.scrollBy(scrollSpeed, 0);

    // Get dimensions
    const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
    const naturalWidth = getScrollWidth(table.dataTable);
    const naturalHeight = getScrollHeight(table.dataTable);
    
    // Calculate new dimensions
    const width = e.clientX - getOffsetLeft(table.mydiv) + window.scrollX;
    const height = e.clientY - getOffsetTop(table.mydiv) + window.scrollY;

    // Set width based on mode
    if (table.resizeMode === 'hide') {
        setStyle(table.mydiv, 'width', Math.max(width, naturalWidth, 200) + 'px');
    } else {
        setStyle(table.mydiv, 'width', Math.max(width, 200) + 'px');
    }

    // Set heights based on mode
    if (table.resizeMode === 'hide') {
        setTableHeights(table, mydivHeaderHeight, 'hide');
    } else {
        // For all non-hide modes, handle the same way
        const maxHeight = window.innerHeight - 50;
        let finalHeight = Math.min(maxHeight, Math.max(height, mydivHeaderHeight * 2));
        
        setTableHeights(table, finalHeight, table.resizeMode);
    }

    updateResizeButtons(table);
}

function stopResize() {
    // Remove all event listeners
    document.documentElement.removeEventListener('mousemove', currentResizeFunction, false);
    document.documentElement.removeEventListener('mouseup', stopResize, false);
    
    // Reset the function reference
    currentResizeFunction = null;
    
    // Reset the starting variables
    startX = null;
    startY = null;
    startWidth = null;
    startHeight = null;
}

function updateResize(table) {
    const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
    const naturalWidth = getScrollWidth(table.dataTable);
    const naturalHeight = getScrollHeight(table.dataTable);
    const currentWidth = getOffsetWidth(table.mydiv);
    
    // Calculate minimum size based on content
    const minSize = calculateMinimumTableSize(table);

    // Batch DOM updates to prevent excessive reflow/repaint
    requestAnimationFrame(() => {
        // Set width based on mode
        if (table.resizeMode === 'hide') {
            setStyle(table.mydiv, 'width', Math.max(currentWidth, naturalWidth, 200) + 'px');
        } else {
            // For both 'free' and 'full' modes, use the same logic for width
            const minWidth = table.resizeMode === 'full' ? Math.max(200, minSize.width) : 200;
            setStyle(table.mydiv, 'width', Math.max(currentWidth, minWidth) + 'px');
        }
    
        // Set heights based on mode
        if (table.resizeMode === 'hide') {
            setTableHeights(table, mydivHeaderHeight, 'hide');
        } else if (table.resizeMode === 'free') {
            // For free mode, use current height or set a default that shows at least the histogram
            if (!table.histogramHeight) {
                measureHistogramHeight(table);
            }
            
            // Determine the appropriate height for free mode
            const currentContainerHeight = getOffsetHeight(table.mydiv);
            const minFreeHeight = mydivHeaderHeight + table.histogramHeight + 50; // Header + histogram + some buffer
            
            // If we already have a height set, use it, otherwise use minimum height for free mode
            const finalHeight = currentContainerHeight > 0 ? 
                Math.max(currentContainerHeight, minFreeHeight) : 
                minFreeHeight;
                
            setTableHeights(table, finalHeight, 'free');
        } else if (table.resizeMode === 'full') {
            // For full mode, show the full table
            // Get full height of the table including all rows
            const fullTableHeight = Math.max(naturalHeight + mydivHeaderHeight, minSize.height);
            setTableHeights(table, fullTableHeight, 'full');
        }
    
        updateResizeButtons(table);
    });
}

function measureHistogramHeight(table) {
    // Get the first row from the table which we assume contains the histogram
    const firstRow = table.dataTable.querySelector('tr:first-child');
    
    if (firstRow) {
        // Measure the height of the first row (histogram)
        const histogramHeight = firstRow.offsetHeight;
        
        // Store it in the table object for future reference
        table.histogramHeight = histogramHeight;
        
        // Return the measured height
        return histogramHeight;
    }
    
    // Default fallback height if we can't measure
    return 100; 
}

function changeResizeMode(table, newMode) {
    const previousMode = table.resizeMode;
    table.resizeMode = newMode;
    
    // If we're switching to free mode or full mode and don't have histogram height yet, measure it
    if ((newMode === 'free' || newMode === 'full') && !table.histogramHeight) {
        measureHistogramHeight(table);
    }
    
    // Special handling when switching between certain modes
    if (previousMode === 'hide' && (newMode === 'free' || newMode === 'full')) {
        // If coming from 'hide' mode, we need to make the table visible again
        setStyle(table.dataTable, 'display', 'table');
    }
    
    // If switching to 'full' mode, set the height to show the entire table
    if (newMode === 'full') {
        const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
        const naturalHeight = getScrollHeight(table.dataTable);
        const minSize = calculateMinimumTableSize(table);
        const fullTableHeight = Math.max(naturalHeight + mydivHeaderHeight, minSize.height);
        setTableHeights(table, fullTableHeight, 'full');
        return;
    }
    
    // If switching to 'free' mode, preserve current height if it's appropriate
    if (newMode === 'free') {
        const currentHeight = getOffsetHeight(table.mydiv);
        const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
        const minFreeHeight = mydivHeaderHeight + table.histogramHeight;
        
        // Use current height if it's larger than our minimum requirement
        if (currentHeight > minFreeHeight) {
            setTableHeights(table, currentHeight, 'free');
            return;
        }
    }
    
    // Use updateResize for other cases or default behavior
    updateResize(table);
}

function setTableHeights(table, containerHeight, mode, customWidth) {
    const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
    const minSize = calculateMinimumTableSize(table);
    const naturalHeight = getScrollHeight(table.dataTable);
    
    // Different handling based on mode
    if (mode === 'hide') {
        // Remove minimum dimensions for hide mode
        setStyle(table.mydiv, 'min-width', '');
        setStyle(table.mydiv, 'min-height', '');
        setStyle(table.scrolldiv, 'min-width', '');
        setStyle(table.scrolldiv, 'min-height', '');
    } else if (mode === 'full') {
        // Set minimum dimensions for full mode based on calculated values
        setStyle(table.mydiv, 'min-width', minSize.width + 'px');
        setStyle(table.mydiv, 'min-height', mydivHeaderHeight + 50 + 'px'); // Allow resizing down, but keep header visible
    } else {
        // Remove minimum dimensions for other modes
        setStyle(table.mydiv, 'min-width', '');
        setStyle(table.mydiv, 'min-height', '');
        setStyle(table.scrolldiv, 'min-width', '');
        setStyle(table.scrolldiv, 'min-height', '');
    }
    
    // 1. Set the container (mydiv) height
    setStyle(table.mydiv, 'height', containerHeight + 'px');
    
    // 2. Set the scroll container (scrolldiv) properties
    setStyle(table.scrolldiv, 'width', '100%');
    setStyle(table.scrolldiv, 'height', 'calc(100% - ' + mydivHeaderHeight + 'px)');
    setStyle(table.scrolldiv, 'max-height', 'none'); // Remove max-height
    setStyle(table.scrolldiv, 'overflow-x', 'auto'); // Allow horizontal scroll if needed
    
    // 3. Set the table height and display properties based on mode
    if (mode === 'hide') {
        setStyle(table.dataTable, 'display', 'none');
        setStyle(table.scrolldiv, 'height', '0px');
    } else {
        setStyle(table.dataTable, 'display', 'table');
        setStyle(table.dataTable, 'width', '100%');
        
        if (mode === 'free') {
            // Get available space in the scroll container (after header)
            const availableSpace = containerHeight - mydivHeaderHeight;
            
            // Add buffer to prevent flickering when near the threshold
            const bufferHeight = 20;
            
            // In free mode, we always use natural table height and handle overflow with scroll
            setStyle(table.dataTable, 'height', ''); // Use natural height
            
            // Only switch between scroll states if there's a significant difference
            // to prevent flickering when near the threshold
            if (!table.lastScrollState || 
                Math.abs(naturalHeight - availableSpace) > bufferHeight) {
                
                if (naturalHeight > availableSpace + bufferHeight) {
                    // Table is significantly bigger than available space, enable scrolling
                    setStyle(table.scrolldiv, 'overflow-y', 'auto');
                    table.lastScrollState = 'scroll';
                } else if (naturalHeight < availableSpace - bufferHeight) {
                    // Table is significantly smaller than available space, no need for scrolling
                    setStyle(table.scrolldiv, 'overflow-y', 'hidden');
                    table.lastScrollState = 'hidden';
                }
                // If we're within the buffer, maintain the previous state to prevent flickering
            }
        } else if (mode === 'full') {
            // 'full' mode always uses scrolling to allow resizing down
            setStyle(table.dataTable, 'height', '');  // Let table determine its natural height
            setStyle(table.scrolldiv, 'overflow-y', 'auto'); 
        }
    }
}

function doResizeWithPosition(e, table, position, startWidth, startHeight, startLeft, startTop) {
    const scrollSpeed = 10;
    const edgeDistance = 100;
    
    // Get minimum table size based on content
    const minSize = calculateMinimumTableSize(table);
    const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
    
    // Minimum dimensions to prevent collapsing the table
    let minWidth = 200;
    let minHeight = mydivHeaderHeight + 50; // Always include header height + some buffer
    
    // Adjust minimum height based on mode
    if (table.resizeMode === 'full') {
        // For full mode, enforce content-based minimum width
        minWidth = Math.max(minWidth, minSize.width);
    } else if (table.resizeMode === 'free') {
        // For free mode, ensure we at least show the histogram
        if (!table.histogramHeight) {
            measureHistogramHeight(table);
        }
        minHeight = mydivHeaderHeight + table.histogramHeight;
    }

    // Handle scrolling near edges
    if (e.clientY < edgeDistance) window.scrollBy(0, -scrollSpeed);
    if (window.innerHeight - e.clientY < edgeDistance) window.scrollBy(0, scrollSpeed);
    if (e.clientX < edgeDistance) window.scrollBy(-scrollSpeed, 0);
    if (window.innerWidth - e.clientX < edgeDistance) window.scrollBy(scrollSpeed, 0);

    // Calculate dimension deltas
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Current dimensions - batch these calculations to avoid layout thrashing
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;
    
    // Handle the resize based on which handle was dragged
    if (position.includes('e')) {
        // Right edge
        newWidth = Math.max(startWidth + deltaX, minWidth);
    }
    if (position.includes('w')) {
        // Left edge
        const maxDeltaX = startWidth - minWidth;
        const actualDeltaX = Math.max(-maxDeltaX, deltaX);
        newWidth = startWidth - actualDeltaX;
        newLeft = startLeft + actualDeltaX;
    }
    
    if (position.includes('s')) {
        // Bottom edge
        newHeight = Math.max(startHeight + deltaY, minHeight);
    }
    if (position.includes('n')) {
        // Top edge
        const maxDeltaY = startHeight - minHeight;
        const actualDeltaY = Math.max(-maxDeltaY, deltaY);
        newHeight = startHeight - actualDeltaY;
        newTop = startTop + actualDeltaY;
    }
    
    // Batch DOM updates to prevent excessive reflow/repaint
    requestAnimationFrame(() => {
        // Apply the new position and dimensions
        setStyle(table.mydiv, 'width', newWidth + 'px');
        setStyle(table.mydiv, 'left', newLeft + 'px');
        setStyle(table.mydiv, 'top', newTop + 'px');
        
        // Update table heights based on resize mode
        if (table.resizeMode === 'hide') {
            setTableHeights(table, mydivHeaderHeight, 'hide');
        } else if (table.resizeMode === 'free' || table.resizeMode === 'full') {
            setTableHeights(table, newHeight, table.resizeMode);
        }
        
        // Update the table's position object
        table.position.left = newLeft + 'px';
        table.position.top = newTop + 'px';
        
        // Ensure the table stays within the viewport
        keepInViewport(table);
        
        // Update UI last to reflect new state
        updateResizeButtons(table);
    });
} 