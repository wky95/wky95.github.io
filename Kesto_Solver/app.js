document.addEventListener('DOMContentLoaded', () => {
    const gridEl = document.getElementById('grid');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const btnClear = document.getElementById('btn-clear');
    const btnSolve = document.getElementById('btn-solve');
    const btnEdit = document.getElementById('btn-edit');
    const solverMessage = document.getElementById('solver-message');
    
    // Playback Controls
    const solutionControls = document.getElementById('solution-controls');
    const stepCurrentEl = document.getElementById('current-step');
    const stepTotalEl = document.getElementById('total-steps');
    const pathDisplay = document.getElementById('path-display');
    const btnPrev = document.getElementById('btn-prev');
    const btnPlay = document.getElementById('btn-play');

    let bgGrid = Array(8).fill().map(() => Array(8).fill('.'));
    let fgGrid = Array(8).fill().map(() => Array(8).fill('.'));
    let cells = []; // 2D array of DOM elements
    
    // Default puzzle from original C++ code
    const defaultGrid = [
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........"
    ];

    function saveGrid() {
        localStorage.setItem('kestoBgGrid', JSON.stringify(bgGrid));
        localStorage.setItem('kestoFgGrid', JSON.stringify(fgGrid));
    }

    function loadGrid() {
        const savedBg = localStorage.getItem('kestoBgGrid');
        const savedFg = localStorage.getItem('kestoFgGrid');
        if (savedBg && savedFg) {
            try {
                bgGrid = JSON.parse(savedBg);
                fgGrid = JSON.parse(savedFg);
                return true;
            } catch(e) {
                console.error("Failed to load grid from localStorage", e);
            }
        }
        return false;
    }

    let isDrawing = false;
    let blockEntities = []; // Array of DOM elements for moving blocks

    let playbackStates = [];
    let playbackPath = [];
    let playbackIdentities = [];
    let currentStep = 0;

    function initGrid() {
        gridEl.innerHTML = '';
        cells = [];
        
        const hasSaved = loadGrid();

        for (let r = 0; r < 8; r++) {
            cells[r] = [];
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                
                if (!hasSaved) {
                    // Load default
                    const char = defaultGrid[r][c];
                    if (char === '#' || char === 'T') {
                        bgGrid[r][c] = char;
                    } else if (char === 'Y') {
                        fgGrid[r][c] = 'Y';
                    }
                }
                updateCellClass(cell, r, c);

                // Events for drawing
                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    if (!solutionControls.classList.contains('hidden')) return;
                    isDrawing = true;
                    applyTool(r, c);
                });
                cell.addEventListener('mouseenter', (e) => {
                    if (isDrawing && solutionControls.classList.contains('hidden')) {
                        e.preventDefault();
                        applyTool(r, c);
                    }
                });

                gridEl.appendChild(cell);
                cells[r][c] = cell;
            }
        }
        
        // Remove old block entities
        clearBlockEntities();
        
        // We only render .block-entity if we are playing back.
        // During editing, blocks are rendered as cell backgrounds to make it simpler.
    }

    function updateCellClass(cell, r, c) {
        cell.className = 'cell';
        if (bgGrid[r][c] === '#') cell.classList.add('wall');
        if (bgGrid[r][c] === 'T') cell.classList.add('target');
        if (fgGrid[r][c] === 'Y') cell.classList.add('block');
    }

    function restoreGridVisuals() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                updateCellClass(cells[r][c], r, c);
            }
        }
    }

    function clearBlockEntities() {
        blockEntities.forEach(el => el.remove());
        blockEntities = [];
    }

    function applyTool(r, c) {
        solutionControls.classList.add('hidden');
        solverMessage.textContent = "Board modified. Ready to solve.";
        solverMessage.style.color = "var(--text-secondary)";
        clearBlockEntities();
        restoreGridVisuals();
        
        if (currentTool === '.') {
            bgGrid[r][c] = '.';
            fgGrid[r][c] = '.';
        } else if (currentTool === '#' || currentTool === 'T') {
            bgGrid[r][c] = currentTool;
            if (currentTool === '#') fgGrid[r][c] = '.';
        } else if (currentTool === 'Y') {
            fgGrid[r][c] = 'Y';
            if (bgGrid[r][c] === '#') bgGrid[r][c] = '.';
        }
        
        updateCellClass(cells[r][c], r, c);
        saveGrid();
    }

    document.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    // Tool Selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    // Edit Board
    btnEdit.addEventListener('click', () => {
        solutionControls.classList.add('hidden');
        btnEdit.classList.add('hidden');
        btnSolve.classList.remove('hidden');

        // Update fgGrid to match the current playback step
        const currentBlocks = playbackIdentities[currentStep] || [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                fgGrid[r][c] = '.';
            }
        }
        currentBlocks.forEach(pos => {
            if (pos) {
                fgGrid[pos.r][pos.c] = 'Y';
            }
        });

        clearBlockEntities();
        restoreGridVisuals();
        saveGrid();
        solverMessage.textContent = "Edit mode. Ready to solve.";
        solverMessage.style.color = "var(--text-secondary)";
    });

    // Clear Board
    btnClear.addEventListener('click', () => {
        solutionControls.classList.add('hidden');
        btnEdit.classList.add('hidden');
        btnSolve.classList.remove('hidden');
        clearBlockEntities();
        solverMessage.textContent = "Board cleared.";
        solverMessage.style.color = "var(--text-secondary)";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                bgGrid[r][c] = '.';
                fgGrid[r][c] = '.';
                updateCellClass(cells[r][c], r, c);
            }
        }
        saveGrid();
    });

    // Solve
    btnSolve.addEventListener('click', () => {
        solverMessage.textContent = "Solving... Please wait.";
        solverMessage.style.color = "var(--text-primary)";
        solutionControls.classList.add('hidden');

        // Allow UI to update before heavy computation
        setTimeout(() => {
            try {
                const solver = new Solver(bgGrid, fgGrid);
                const result = solver.solve();

                if (result.success) {
                    solverMessage.textContent = result.message;
                    solverMessage.style.color = "#00ff88";
                    
                    playbackStates = result.states;
                    playbackPath = result.path;
                    
                    if (result.path.length > 0) {
                        pathDisplay.textContent = result.path.join(' → ');
                        solutionControls.classList.remove('hidden');
                        btnSolve.classList.add('hidden');
                        btnEdit.classList.remove('hidden');
                        stepTotalEl.textContent = result.path.length;
                        currentStep = 0;
                        computeBlockIdentities();
                        renderStep(0);
                    } else {
                        // Already solved
                        solutionControls.classList.add('hidden');
                    }
                } else {
                    solverMessage.textContent = result.message || "No solution found.";
                    solverMessage.style.color = "#ff2a6d";
                    solutionControls.classList.add('hidden');
                    btnEdit.classList.add('hidden');
                    btnSolve.classList.remove('hidden');
                    clearBlockEntities();
                    restoreGridVisuals();
                }
            } catch (err) {
                console.error(err);
                solverMessage.textContent = "An error occurred during solving.";
                solverMessage.style.color = "#ff2a6d";
            }
        }, 50);
    });

    // --- Playback Logic ---

    function getBlocksFromState(stateBigInt) {
        let blocks = [];
        let temp = stateBigInt;
        while (temp > 0n) {
            let idx = 0n;
            let temp2 = temp;
            if (temp2 === 0n) idx = 64n;
            else {
                let count = 0n;
                while ((temp2 & 1n) === 0n) {
                    count++;
                    temp2 >>= 1n;
                }
                idx = count;
            }
            
            blocks.push({
                r: Number(idx) / 8 | 0,
                c: Number(idx) % 8
            });
            temp &= (temp - 1n);
        }
        return blocks;
    }

    function computeBlockIdentities() {
        playbackIdentities = [];
        if (playbackStates.length === 0) return;
        
        let initialBlocks = getBlocksFromState(playbackStates[0]);
        initialBlocks.sort((a, b) => a.r !== b.r ? a.r - b.r : a.c - b.c);
        playbackIdentities.push(initialBlocks);

        for (let i = 1; i < playbackStates.length; i++) {
            let dir = playbackPath[i - 1];
            let prevBlocks = playbackIdentities[i - 1].map((pos, id) => ({ r: pos.r, c: pos.c, id: id }));
            
            let sortFn;
            if (dir === 'U' || dir === 'D') {
                sortFn = (a, b) => a.c !== b.c ? a.c - b.c : a.r - b.r;
            } else {
                sortFn = (a, b) => a.r !== b.r ? a.r - b.r : a.c - b.c;
            }

            prevBlocks.sort(sortFn);
            
            let currBlocks = getBlocksFromState(playbackStates[i]);
            currBlocks.sort(sortFn);
            
            let nextIdentities = new Array(initialBlocks.length);
            for (let j = 0; j < prevBlocks.length; j++) {
                nextIdentities[prevBlocks[j].id] = currBlocks[j];
            }
            playbackIdentities.push(nextIdentities);
        }
    }

    function renderStep(stepIndex) {
        currentStep = stepIndex;
        stepCurrentEl.textContent = stepIndex;

        // Clean grid visual blocks (hide the Y cells so block-entities can overlay them)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (fgGrid[r][c] === 'Y') {
                    cells[r][c].classList.remove('block');
                }
            }
        }

        const blocks = playbackIdentities[stepIndex] || [];

        // Ensure we have correct number of entities
        while (blockEntities.length < blocks.length) {
            const el = document.createElement('div');
            el.className = 'block-entity';
            gridEl.appendChild(el);
            blockEntities.push(el);
        }
        while (blockEntities.length > blocks.length) {
            const el = blockEntities.pop();
            el.remove();
        }

        // Position entities
        blocks.forEach((pos, i) => {
            const cell = cells[pos.r][pos.c];
            const el = blockEntities[i];
            
            // Calculate position relative to grid
            // Grid gap is 4px, cell is 60px, padding is 12px
            const left = 12 + pos.c * 64; 
            const top = 12 + pos.r * 64;
            
            // For responsive layout, better to rely on cell offset relative to grid
            const gridRect = gridEl.getBoundingClientRect();
            const cellRect = cells[pos.r][pos.c].getBoundingClientRect();
            
            el.style.left = (cellRect.left - gridRect.left - 1 /* border adjust */) + 'px';
            el.style.top = (cellRect.top - gridRect.top - 1 /* border adjust */) + 'px';
            el.style.width = cellRect.width + 'px';
            el.style.height = cellRect.height + 'px';

            if (bgGrid[pos.r][pos.c] === 'T') {
                el.classList.add('on-target');
            } else {
                el.classList.remove('on-target');
            }
        });
    }

    // Handle Window Resize to reposition blocks
    window.addEventListener('resize', () => {
        if (solutionControls.classList.contains('hidden') === false) {
            renderStep(currentStep);
        }
    });

    function nextStep() {
        if (currentStep < playbackStates.length - 1) {
            renderStep(currentStep + 1);
        } else {
            // Restart if clicking next at the very end
            renderStep(0);
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            renderStep(currentStep - 1);
        }
    }

    btnPrev.addEventListener('click', () => { prevStep(); });
    btnPlay.addEventListener('click', () => { nextStep(); });

    // Init
    initGrid();
});
