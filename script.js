document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const tileContainer = document.querySelector('.tile-container');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartButtonHeader = document.getElementById('restart-button-header');
    const restartButtonGameOver = document.getElementById('restart-button-gameover');
    const themeButton = document.getElementById('theme-button');
    const shareButton = document.getElementById('share-button');
    const gridSize = 4;
    let grid;
    let score;
    let bestScore;
    let isGameOver;
    let isMoving = false;

    class Tile {
        constructor(value, row, col) {
            this.value = value;
            this.row = row;
            this.col = col;
            this.element = this.createElement();
            this.updatePosition(row, col);
            tileContainer.appendChild(this.element);
        }

        createElement() {
            const element = document.createElement('div');
            const inner = document.createElement('div');
            inner.classList.add('tile-inner');
            inner.textContent = this.value;
            element.classList.add('tile', `tile-${this.value}`, 'tile-new');
            element.addEventListener('animationend', () => {
                element.classList.remove('tile-new');
            }, { once: true });
            element.appendChild(inner);
            return element;
        }

        updateValue(newValue) {
            this.value = newValue;
            const oldClass = Array.from(this.element.classList).find(c => c.startsWith('tile-') && !['tile', 'tile-new', 'tile-merged'].includes(c));
            if(oldClass) this.element.classList.remove(oldClass);
            this.element.classList.add(`tile-${this.value}`);
            this.element.firstChild.textContent = this.value;
        }

        updatePosition(r, c) {
            this.row = r;
            this.col = c;
            this.element.style.top = `${this.row * (107.5 + 15) + 15}px`;
            this.element.style.left = `${this.col * (107.5 + 15) + 15}px`;
        }

        merge() {
            this.element.classList.add('tile-merged');
            this.element.firstChild.addEventListener('animationend', () => {
                this.element.classList.remove('tile-merged');
            }, { once: true });
        }

        destroy() {
            tileContainer.removeChild(this.element);
        }
    }

    function init() {
        setupTheme();
        setupGrid();
        startGame();
        document.addEventListener('keydown', handleInput);
        restartButtonHeader.addEventListener('click', startGame);
        restartButtonGameOver.addEventListener('click', startGame);
        shareButton.addEventListener('click', shareScore);
        setupTouchControls();
    }

    function startGame() {
        grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
        score = 0;
        bestScore = localStorage.getItem('bestScore') || 0;
        bestScoreElement.textContent = bestScore;
        isGameOver = false;
        isMoving = false;
        updateScore(0, true);
        gameOverMessage.style.display = 'none';
        tileContainer.innerHTML = '';

        addRandomTile();
        addRandomTile();

        // Expose grid for testing
        window.grid = grid;
    }

    function setupGrid() {
        gridContainer.innerHTML = '';
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gridContainer.appendChild(cell);
        }
    }

    function addRandomTile() {
        let emptyCells = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === null) {
                    emptyCells.push({ r: i, c: j });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            grid[r][c] = new Tile(value, r, c);
        }
    }

    async function handleInput(e) {
        if (isGameOver || isMoving) return;

        let moved = false;
        // Await move to ensure isMoving flag is handled correctly
        switch (e.key) {
            case 'ArrowUp':
                isMoving = true;
                moved = await move('up');
                break;
            case 'ArrowDown':
                isMoving = true;
                moved = await move('down');
                break;
            case 'ArrowLeft':
                isMoving = true;
                moved = await move('left');
                break;
            case 'ArrowRight':
                isMoving = true;
                moved = await move('right');
                break;
        }

        if (moved) {
            addRandomTile();
            checkGameOver();
        }
        isMoving = false;
    }

    async function move(direction) {
        let hasChanged = false;
        let tilesToDestroy = [];

        const isVertical = direction === 'up' || direction === 'down';
        const isForward = direction === 'up' || direction === 'left';

        for (let i = 0; i < gridSize; i++) {
            const line = isVertical ? grid.map(row => row[i]) : grid[i];
            const filteredLine = line.filter(t => t);

            if (filteredLine.length === 0) continue;

            let lineCopy = [...filteredLine];
            if (!isForward) lineCopy.reverse();

            let mergedLine = [];
            for (let j = 0; j < lineCopy.length; j++) {
                let tile = lineCopy[j];
                let nextTile = lineCopy[j + 1];

                if (nextTile && tile.value === nextTile.value) {
                    // Merge
                    let mergedValue = tile.value * 2;
                    updateScore(mergedValue, false);

                    tile.updateValue(mergedValue);
                    tile.merge();
                    tilesToDestroy.push(nextTile);
                    lineCopy.splice(j + 1, 1); // remove the merged tile
                }
                mergedLine.push(tile);
            }

            const newLine = Array(gridSize).fill(null);
            let targetIndex = isForward ? 0 : gridSize - 1;

            mergedLine.forEach(tile => {
                newLine[targetIndex] = tile;
                targetIndex += isForward ? 1 : -1;
            });

            // Check for changes and update positions
            for(let k=0; k<gridSize; k++){
                let r = isVertical ? k : i;
                let c = isVertical ? i : k;
                if(line[k] !== newLine[k]){
                    hasChanged = true;
                }
                if(isVertical) grid[k][i] = newLine[k];
                else grid[i][k] = newLine[k];

                if(grid[r][c]){
                    grid[r][c].updatePosition(r,c);
                }
            }
        }

        // Wait for move animations
        await new Promise(resolve => setTimeout(resolve, 100));

        // Clean up DOM
        tilesToDestroy.forEach(t => t.destroy());

        return hasChanged;
    }

    function updateScore(newPoints, isReset = false) {
        if (!isReset) {
            score += newPoints;
        }
        scoreElement.textContent = score;

        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('bestScore', bestScore);
        }
    }

    function checkGameOver() {
        if (!canMove()) {
            isGameOver = true;
            gameOverMessage.style.display = 'flex';
        }
    }

    function canMove() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === null) return true;
                const current = grid[i][j].value;
                if (i + 1 < gridSize && grid[i+1][j] && current === grid[i+1][j].value) return true;
                if (j + 1 < gridSize && grid[i][j+1] && current === grid[i][j+1].value) return true;
            }
        }
        return false;
    }

    function setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        const gameArea = document.querySelector('.game-container');

        gameArea.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        gameArea.addEventListener('touchmove', (e) => {
            // Prevent scrolling
            e.preventDefault();
        }, { passive: false });

        gameArea.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            handleSwipe();
        });

        function handleSwipe() {
            if (isMoving) return;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const swipeThreshold = 30; // Minimum distance for a swipe

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > swipeThreshold) {
                    const direction = deltaX > 0 ? 'right' : 'left';
                    handleInput({ key: `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}` });
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > swipeThreshold) {
                    const direction = deltaY > 0 ? 'down' : 'up';
                    handleInput({ key: `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}` });
                }
            }
        }
    }

    function setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
        }

        themeButton.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.removeItem('theme');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    function shareScore() {
        const shareData = {
            title: '2048 Game',
            text: `I scored ${score} in 2048! Can you beat it?`,
            url: window.location.href
        };

        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => console.log('Successful share'))
                .catch((error) => console.log('Error sharing', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            alert("Your browser does not support the Share API. You can manually copy the link to share!");
        }
    }

    init();
});
