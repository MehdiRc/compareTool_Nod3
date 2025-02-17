// Global resize variables
let startX, startY, startWidth, startHeight;
let currentResizeFunction = null;

function dragElement(element, headerId, table) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(headerId);
    
    if (header) {
        header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        if (table.pin) return;
        e.preventDefault();
        
        // Get mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        
        // Bring element to front
        element.style.zIndex = ++maxZIndex;
    }

    function elementDrag(e) {
        e.preventDefault();
        
        // Calculate new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        
        // Update table position
        table.position.top = element.style.top;
        table.position.left = element.style.left;
    }

    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function disableDragElement(element, headerId) {
    const header = document.getElementById(headerId);
    if (header) {
        header.onmousedown = null;
    }
}

function doResize(e, table) {
    e.preventDefault();
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    switch (table.resizeMode) {
        case 'both':
            // Ensure minimum width
            const newWidth = Math.max(800, startWidth + dx);
            table.mydiv.style.width = newWidth + 'px';
            
            // Set scroll container height
            const newHeight = Math.max(100, startHeight + dy);
            table.scrolldiv.style.maxHeight = newHeight + 'px';
            break;
            
        case 'free':
            // Only adjust width
            const width = Math.max(800, startWidth + dx);
            table.mydiv.style.width = width + 'px';
            
            // Reset scroll container
            table.scrolldiv.style.maxHeight = '400px';
            break;
            
        case 'hide':
            // Hide table content
            table.scrolldiv.style.display = 'none';
            break;
    }
}

function stopResize() {
    document.documentElement.removeEventListener('mousemove', currentResizeFunction, false);
    document.documentElement.removeEventListener('mouseup', stopResize, false);
    currentResizeFunction = null;
}

function updateResize(table) {
    // Update resize mode buttons
    const buttons = [
        document.getElementById('hide-table' + table.index),
        document.getElementById('resize-free' + table.index),
        document.getElementById('resize-both' + table.index)
    ];
    
    buttons.forEach(button => button.classList.remove('active'));
    
    switch (table.resizeMode) {
        case 'hide':
            buttons[0].classList.add('active');
            table.scrolldiv.style.display = 'none';
            break;
        case 'free':
            buttons[1].classList.add('active');
            table.scrolldiv.style.display = 'block';
            table.scrolldiv.style.maxHeight = '400px';
            break;
        case 'both':
            buttons[2].classList.add('active');
            table.scrolldiv.style.display = 'block';
            break;
    }
}

// Initialize max z-index for proper layering
let maxZIndex = 9; 