document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const tileContainer = document.querySelector('.tile-container');
    const scoreElement = document.getElementById('score');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartButton = document.getElementById('restart-button');
    const gridSize = 4;
    let grid = [];
    let score = 0;
    let isGameOver = false;

    // Initialize the game
    function init() {
        setupGrid();
        startGame();
        document.addEventListener('keydown', handleInput);
        restartButton.addEventListener('click', startGame);
    }

    // Start a new game
    function startGame() {
        grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        score = 0;
        isGameOver = false;
        scoreElement.textContent = score;
        gameOverMessage.style.display = 'none';
        tileContainer.innerHTML = '';
        addRandomTile();
        addRandomTile();
        renderGrid();
    }

    // Create the background grid
    function setupGrid() {
        gridContainer.innerHTML = ''; // Clear previous grid
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gridContainer.appendChild(cell);
        }
    }

    // Render the grid with tiles
    function renderGrid() {
        tileContainer.innerHTML = '';
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    const value = grid[i][j];
                    tile.classList.add('tile', `tile-${value}`);
                    tile.style.top = `${i * (107.5 + 15) + 15}px`;
                    tile.style.left = `${j * (107.5 + 15) + 15}px`;
                    tile.textContent = value;
                    tileContainer.appendChild(tile);
                }
            }
        }
    }

    // Add a random tile (2 or 4) to an empty cell
    function addRandomTile() {
        let emptyCells = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === 0) {
                    emptyCells.push({ x: i, y: j });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            grid[x][y] = value;
        }
    }

    // Handle keyboard input
    function handleInput(e) {
        if (isGameOver) return;

        const gridBeforeMove = JSON.stringify(grid);

        switch (e.key) {
            case 'ArrowUp':
                moveUp();
                break;
            case 'ArrowDown':
                moveDown();
                break;
            case 'ArrowLeft':
                moveLeft();
                break;
            case 'ArrowRight':
                moveRight();
                break;
            default:
                return;
        }

        const moved = (gridBeforeMove !== JSON.stringify(grid));

        if (moved) {
            addRandomTile();
            renderGrid();
            checkGameOver();
        }
    }

    // Helper function to slide and merge a line (row or column)
    function slideAndMerge(line) {
        // 1. Filter out zeros
        let filteredLine = line.filter(num => num !== 0);

        // 2. Merge tiles
        for (let i = 0; i < filteredLine.length - 1; i++) {
            if (filteredLine[i] === filteredLine[i+1]) {
                filteredLine[i] *= 2;
                updateScore(filteredLine[i]);
                filteredLine[i+1] = 0;
            }
        }

        // 3. Filter out zeros again
        let newLine = filteredLine.filter(num => num !== 0);

        // 4. Add zeros back to the end
        while(newLine.length < gridSize) {
            newLine.push(0);
        }

        return newLine;
    }

    function moveUp() {
        for (let j = 0; j < gridSize; j++) {
            let column = [];
            for(let i = 0; i < gridSize; i++) {
                column.push(grid[i][j]);
            }
            let newColumn = slideAndMerge(column);
            for(let i = 0; i < gridSize; i++) {
                grid[i][j] = newColumn[i];
            }
        }
    }

    function moveDown() {
        for (let j = 0; j < gridSize; j++) {
            let column = [];
            for(let i = 0; i < gridSize; i++) {
                column.push(grid[i][j]);
            }
            let reversedColumn = column.reverse();
            let newReversedColumn = slideAndMerge(reversedColumn);
            let newColumn = newReversedColumn.reverse();
            for(let i = 0; i < gridSize; i++) {
                grid[i][j] = newColumn[i];
            }
        }
    }

    function moveLeft() {
        for (let i = 0; i < gridSize; i++) {
            let row = grid[i];
            let newRow = slideAndMerge(row);
            grid[i] = newRow;
        }
    }

    function moveRight() {
        for (let i = 0; i < gridSize; i++) {
            let row = grid[i];
            let reversedRow = row.reverse();
            let newReversedRow = slideAndMerge(reversedRow);
            let newRow = newReversedRow.reverse();
            grid[i] = newRow;
        }
    }

    // Update the score
    function updateScore(newPoints) {
        score += newPoints;
        scoreElement.textContent = score;
    }

    // Check for game over
    function checkGameOver() {
        if (!canMove()) {
            isGameOver = true;
            gameOverMessage.style.display = 'flex';
        }
    }

    function canMove() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === 0) return true; // empty cell
                if (i + 1 < gridSize && grid[i][j] === grid[i+1][j]) return true; // can merge down
                if (j + 1 < gridSize && grid[i][j] === grid[i][j+1]) return true; // can merge right
            }
        }
        return false;
    }

    // Initialize the game
    init();
});
