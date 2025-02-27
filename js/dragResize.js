// Global resize variables
let startX, startY, startWidth, startHeight;
let currentResizeFunction = null;

// Initialize max z-index for proper layering
let maxZIndex = 9;

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
    const bothBtn = document.getElementById('resize-both' + table.index);

    // Reset all buttons
    [hideBtn, freeBtn, bothBtn].forEach(btn => {
        if (btn) {
            btn.classList.remove('active');
            btn.style.backgroundColor = '';
        }
    });

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
        case 'both':
            if (bothBtn) {
                bothBtn.classList.add('active');
                bothBtn.style.backgroundColor = '#555';
            }
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
    } else if (table.resizeMode === 'free' || table.resizeMode === 'both') {
        const maxHeight = window.innerHeight - 50;
        let finalHeight = Math.min(maxHeight, Math.max(height, mydivHeaderHeight * 2));
        
        setTableHeights(table, finalHeight, table.resizeMode);
    }

    updateResizeButtons(table);
}

function stopResize() {
    document.documentElement.removeEventListener('mousemove', currentResizeFunction, false);
    document.documentElement.removeEventListener('mouseup', stopResize, false);
    currentResizeFunction = null;
}

function updateResize(table) {
    const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
    const naturalWidth = getScrollWidth(table.dataTable);
    const naturalHeight = getScrollHeight(table.dataTable);
    const currentWidth = getOffsetWidth(table.mydiv);

    // Set width based on mode
    if (table.resizeMode === 'hide') {
        setStyle(table.mydiv, 'width', Math.max(currentWidth, naturalWidth, 200) + 'px');
    } else {
        setStyle(table.mydiv, 'width', Math.max(currentWidth, 200) + 'px');
    }

    // Set heights based on mode
    if (table.resizeMode === 'hide') {
        setTableHeights(table, mydivHeaderHeight, 'hide');
    } else if (table.resizeMode === 'free' || table.resizeMode === 'both') {
        const defaultHeight = Math.min(window.innerHeight - 50, Math.max(400, mydivHeaderHeight * 2));
        let finalHeight = defaultHeight;
        
        setTableHeights(table, finalHeight, table.resizeMode);
    }

    updateResizeButtons(table);
}

function changeResizeMode(table, newMode) {
    table.resizeMode = newMode;
    updateResize(table);
}

function setTableHeights(table, containerHeight, mode) {
    const mydivHeaderHeight = getOffsetHeight(table.mydivheader);
    
    // Set min dimensions for 'both' mode only
    if (mode === 'both') {
        const naturalWidth = getScrollWidth(table.dataTable);
        const naturalHeight = getScrollHeight(table.dataTable);
        
        // Set minimum dimensions on both mydiv and scrolldiv
        setStyle(table.mydiv, 'min-width', naturalWidth + 'px');
        setStyle(table.mydiv, 'min-height', (naturalHeight + mydivHeaderHeight) + 'px');
        setStyle(table.scrolldiv, 'min-width', naturalWidth + 'px');
        setStyle(table.scrolldiv, 'min-height', naturalHeight + 'px');
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
    setStyle(table.scrolldiv, 'overflow-x', 'hidden'); // Prevent horizontal scroll
    
    // 3. Set the table height and display properties based on mode
    if (mode === 'hide') {
        setStyle(table.dataTable, 'display', 'none');
        setStyle(table.scrolldiv, 'height', '0px');
    } else {
        setStyle(table.dataTable, 'display', 'table');
        setStyle(table.dataTable, 'width', '100%');
        setStyle(table.dataTable, 'height', '100%');
        
        // Both 'free' and 'both' modes use the same overflow settings
        if (mode === 'free' || mode === 'both') {
            setStyle(table.scrolldiv, 'overflow-y', 'auto'); // Only vertical scroll
            setStyle(table.dataTable, 'overflow-y', 'auto');
        } else {
            setStyle(table.scrolldiv, 'overflow', 'hidden');
            setStyle(table.dataTable, 'overflow', 'hidden');
        }
    }
} 