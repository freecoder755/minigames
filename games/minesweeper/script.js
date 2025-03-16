document.addEventListener('DOMContentLoaded', function() {
    // 游戏配置
    const config = {
        easy: { rows: 9, cols: 9, mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard: { rows: 16, cols: 30, mines: 99 }
    };
    
    // 游戏状态
    let gameState = {
        board: [],
        minesCount: 0,
        flagsCount: 0,
        revealedCount: 0,
        gameStarted: false,
        gameOver: false,
        timer: 0,
        timerInterval: null,
        difficulty: 'medium'
    };
    
    // DOM 元素
    const gameBoard = document.getElementById('game-board');
    const minesCountDisplay = document.getElementById('mines-count');
    const timerDisplay = document.getElementById('timer');
    const newGameBtn = document.getElementById('new-game-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const gameMessage = document.getElementById('game-message');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const messageButton = document.getElementById('message-button');
    
    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        gameState.board = [];
        gameState.gameStarted = false;
        gameState.gameOver = false;
        gameState.revealedCount = 0;
        gameState.flagsCount = 0;
        gameState.timer = 0;
        
        // 清除计时器
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        
        // 更新计时器显示
        timerDisplay.textContent = '0';
        
        // 获取当前难度
        const { rows, cols, mines } = config[gameState.difficulty];
        gameState.minesCount = mines;
        
        // 更新地雷计数显示
        minesCountDisplay.textContent = mines;
        
        // 创建游戏板
        createBoard(rows, cols);
        
        // 隐藏游戏消息
        gameMessage.classList.remove('show');
    }
    
    // 创建游戏板
    function createBoard(rows, cols) {
        // 清空游戏板
        gameBoard.innerHTML = '';
        
        // 设置游戏板网格
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
        gameBoard.style.gridTemplateRows = `repeat(${rows}, 30px)`;
        
        // 响应式调整
        if (window.innerWidth <= 768) {
            gameBoard.style.gridTemplateColumns = `repeat(${cols}, 25px)`;
            gameBoard.style.gridTemplateRows = `repeat(${rows}, 25px)`;
        }
        
        if (window.innerWidth <= 480) {
            gameBoard.style.gridTemplateColumns = `repeat(${cols}, 20px)`;
            gameBoard.style.gridTemplateRows = `repeat(${rows}, 20px)`;
        }
        
        // 初始化游戏板数组
        for (let i = 0; i < rows; i++) {
            gameState.board[i] = [];
            for (let j = 0; j < cols; j++) {
                // 创建单元格
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // 添加事件监听器
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleCellRightClick);
                cell.addEventListener('dblclick', handleCellDoubleClick);
                
                // 添加到游戏板
                gameBoard.appendChild(cell);
                
                // 初始化单元格状态
                gameState.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                    element: cell
                };
            }
        }
    }
    
    // 放置地雷
    function placeMines(firstRow, firstCol) {
        const { rows, cols, mines } = config[gameState.difficulty];
        let minesPlaced = 0;
        
        // 确保第一次点击的位置及其周围没有地雷
        const safeZone = [];
        for (let i = Math.max(0, firstRow - 1); i <= Math.min(rows - 1, firstRow + 1); i++) {
            for (let j = Math.max(0, firstCol - 1); j <= Math.min(cols - 1, firstCol + 1); j++) {
                safeZone.push({ row: i, col: j });
            }
        }
        
        // 随机放置地雷
        while (minesPlaced < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            
            // 检查是否在安全区域内
            const isSafe = safeZone.some(pos => pos.row === row && pos.col === col);
            
            // 如果不在安全区域且不是地雷，则放置地雷
            if (!isSafe && !gameState.board[row][col].isMine) {
                gameState.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        // 计算每个单元格周围的地雷数量
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!gameState.board[i][j].isMine) {
                    gameState.board[i][j].adjacentMines = countAdjacentMines(i, j);
                }
            }
        }
    }
    
    // 计算周围地雷数量
    function countAdjacentMines(row, col) {
        let count = 0;
        const { rows, cols } = config[gameState.difficulty];
        
        // 检查周围8个方向
        for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                // 跳过自身
                if (i === row && j === col) continue;
                
                // 如果是地雷，计数加1
                if (gameState.board[i][j].isMine) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    // 处理单元格点击
    function handleCellClick(event) {
        if (gameState.gameOver) return;
        
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // 如果已标记为地雷，不能点击
        if (gameState.board[row][col].isFlagged) return;
        
        // 如果已经揭开，不做任何操作
        if (gameState.board[row][col].isRevealed) return;
        
        // 如果是第一次点击，开始游戏
        if (!gameState.gameStarted) {
            gameState.gameStarted = true;
            placeMines(row, col);
            startTimer();
        }
        
        // 揭开单元格
        revealCell(row, col);
    }
    
    // 处理单元格右键点击（标记地雷）
    function handleCellRightClick(event) {
        event.preventDefault();
        
        if (gameState.gameOver) return;
        
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // 如果已经揭开，不能标记
        if (gameState.board[row][col].isRevealed) return;
        
        // 切换标记状态
        if (gameState.board[row][col].isFlagged) {
            // 取消标记
            gameState.board[row][col].isFlagged = false;
            cell.classList.remove('flagged');
            gameState.flagsCount--;
        } else {
            // 如果标记数量已达到地雷数量，不能再标记
            if (gameState.flagsCount >= gameState.minesCount) return;
            
            // 标记为地雷
            gameState.board[row][col].isFlagged = true;
            cell.classList.add('flagged');
            gameState.flagsCount++;
        }
        
        // 更新地雷计数显示
        minesCountDisplay.textContent = gameState.minesCount - gameState.flagsCount;
        
        // 检查是否胜利
        checkWin();
    }
    
    // 处理单元格双击（快速揭开周围）
    function handleCellDoubleClick(event) {
        if (gameState.gameOver) return;
        
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // 如果单元格未揭开或不是数字，不做任何操作
        if (!gameState.board[row][col].isRevealed || gameState.board[row][col].adjacentMines === 0) return;
        
        // 计算周围已标记的地雷数量
        let flaggedCount = 0;
        const { rows, cols } = config[gameState.difficulty];
        
        for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;
                
                if (gameState.board[i][j].isFlagged) {
                    flaggedCount++;
                }
            }
        }
        
        // 如果标记数量等于周围地雷数量，揭开周围未标记的单元格
        if (flaggedCount === gameState.board[row][col].adjacentMines) {
            for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
                for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                    if (i === row && j === col) continue;
                    
                    // 如果未揭开且未标记，揭开它
                    if (!gameState.board[i][j].isRevealed && !gameState.board[i][j].isFlagged) {
                        revealCell(i, j);
                    }
                }
            }
        }
    }
    
    // 揭开单元格
    function revealCell(row, col) {
        const cell = gameState.board[row][col];
        
        // 如果已经揭开或已标记，不做任何操作
        if (cell.isRevealed || cell.isFlagged) return;
        
        // 标记为已揭开
        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        gameState.revealedCount++;
        
        // 如果是地雷，游戏结束
        if (cell.isMine) {
            cell.element.classList.add('mine', 'exploded');
            gameOver(false);
            return;
        }
        
        // 如果周围有地雷，显示数字
        if (cell.adjacentMines > 0) {
            cell.element.textContent = cell.adjacentMines;
            cell.element.dataset.adjacent = cell.adjacentMines;
        } else {
            // 如果周围没有地雷，自动揭开周围的单元格
            const { rows, cols } = config[gameState.difficulty];
            
            for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
                for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                    if (i === row && j === col) continue;
                    
                    revealCell(i, j);
                }
            }
        }
        
        // 检查是否胜利
        checkWin();
    }
    
    // 检查是否胜利
    function checkWin() {
        const { rows, cols, mines } = config[gameState.difficulty];
        const totalCells = rows * cols;
        
        // 如果揭开的单元格数量 + 地雷数量 = 总单元格数量，则胜利
        if (gameState.revealedCount + mines === totalCells) {
            gameOver(true);
        }
    }
    
    // 游戏结束
    function gameOver(isWin) {
        gameState.gameOver = true;
        
        // 停止计时器
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        
        // 如果失败，显示所有地雷
        if (!isWin) {
            revealAllMines();
        }
        
        // 显示游戏结束消息
        if (isWin) {
            messageTitle.textContent = '恭喜你赢了！';
            messageText.textContent = `你用了 ${gameState.timer} 秒完成了游戏！`;
        } else {
            messageTitle.textContent = '游戏结束';
            messageText.textContent = '很遗憾，你触发了地雷！';
        }
        
        gameMessage.classList.add('show');
    }
    
    // 揭开所有地雷
    function revealAllMines() {
        const { rows, cols } = config[gameState.difficulty];
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = gameState.board[i][j];
                
                // 如果是地雷且未揭开
                if (cell.isMine && !cell.isRevealed) {
                    cell.element.classList.add('mine');
                }
                
                // 如果标记错误（不是地雷但标记为地雷）
                if (cell.isFlagged && !cell.isMine) {
                    cell.element.classList.add('flagged');
                    cell.element.style.backgroundColor = '#ffcccc';
                }
            }
        }
    }
    
    // 开始计时器
    function startTimer() {
        gameState.timer = 0;
        timerDisplay.textContent = '0';
        
        gameState.timerInterval = setInterval(function() {
            gameState.timer++;
            timerDisplay.textContent = gameState.timer;
        }, 1000);
    }
    
    // 事件监听器
    newGameBtn.addEventListener('click', function() {
        initGame();
    });
    
    difficultySelect.addEventListener('change', function() {
        gameState.difficulty = this.value;
        initGame();
    });
    
    messageButton.addEventListener('click', function() {
        gameMessage.classList.remove('show');
        initGame();
    });
    
    // 防止右键菜单
    gameBoard.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });
    
    // 窗口大小改变时调整游戏板
    window.addEventListener('resize', function() {
        const { rows, cols } = config[gameState.difficulty];
        
        if (window.innerWidth <= 480) {
            gameBoard.style.gridTemplateColumns = `repeat(${cols}, 20px)`;
            gameBoard.style.gridTemplateRows = `repeat(${rows}, 20px)`;
        } else if (window.innerWidth <= 768) {
            gameBoard.style.gridTemplateColumns = `repeat(${cols}, 25px)`;
            gameBoard.style.gridTemplateRows = `repeat(${rows}, 25px)`;
        } else {
            gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
            gameBoard.style.gridTemplateRows = `repeat(${rows}, 30px)`;
        }
    });
    
    // 初始化游戏
    initGame();
}); 