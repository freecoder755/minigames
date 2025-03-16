document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const sudokuBoard = document.getElementById('sudoku-board');
    const difficultySelect = document.getElementById('difficulty-select');
    const newGameBtn = document.getElementById('new-game-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    const hintBtn = document.getElementById('hint-btn');
    const notesToggle = document.getElementById('notes-toggle');
    const numberBtns = document.querySelectorAll('.number-btn');
    const timerElement = document.getElementById('timer');
    const gameMessage = document.getElementById('game-message');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const messageButton = document.getElementById('message-button');

    // 游戏状态
    let board = []; // 当前游戏板
    let solution = []; // 解答
    let fixedCells = []; // 固定的单元格（初始数字）
    let selectedCell = null; // 当前选中的单元格
    let isNotesMode = false; // 是否处于笔记模式
    let timerInterval = null; // 计时器
    let seconds = 0; // 游戏时间（秒）
    let hintsUsed = 0; // 使用的提示次数

    // 初始化游戏
    function initGame() {
        createBoard();
        newGame();
        
        // 事件监听
        difficultySelect.addEventListener('change', newGame);
        newGameBtn.addEventListener('click', newGame);
        checkBtn.addEventListener('click', checkSolution);
        solveBtn.addEventListener('click', showSolution);
        hintBtn.addEventListener('click', giveHint);
        notesToggle.addEventListener('click', toggleNotesMode);
        
        // 数字按钮事件
        numberBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (selectedCell) {
                    const number = btn.getAttribute('data-number');
                    enterNumber(number);
                }
            });
        });
        
        // 键盘事件
        document.addEventListener('keydown', handleKeyDown);
        
        // 消息按钮事件
        messageButton.addEventListener('click', () => {
            gameMessage.style.display = 'none';
        });
    }

    // 创建数独游戏板
    function createBoard() {
        sudokuBoard.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            
            // 创建笔记容器
            const notesContainer = document.createElement('div');
            notesContainer.classList.add('notes-container');
            
            // 创建9个笔记格子
            for (let j = 1; j <= 9; j++) {
                const note = document.createElement('div');
                note.classList.add('note');
                note.dataset.note = j;
                notesContainer.appendChild(note);
            }
            
            cell.appendChild(notesContainer);
            
            // 单元格点击事件
            cell.addEventListener('click', () => selectCell(i));
            
            sudokuBoard.appendChild(cell);
        }
    }

    // 开始新游戏
    function newGame() {
        // 重置游戏状态
        resetGameState();
        
        // 生成新的数独谜题
        generateSudoku();
        
        // 更新界面
        updateBoard();
        
        // 开始计时
        startTimer();
    }

    // 重置游戏状态
    function resetGameState() {
        board = Array(81).fill(0);
        solution = Array(81).fill(0);
        fixedCells = Array(81).fill(false);
        selectedCell = null;
        hintsUsed = 0;
        
        // 重置计时器
        clearInterval(timerInterval);
        seconds = 0;
        updateTimer();
    }

    // 生成数独谜题
    function generateSudoku() {
        // 生成完整的解答
        generateSolution();
        
        // 复制解答到当前游戏板
        board = [...solution];
        
        // 根据难度移除数字
        const difficulty = difficultySelect.value;
        let cellsToRemove;
        
        switch(difficulty) {
            case 'easy':
                cellsToRemove = 40; // 简单：保留41个数字
                break;
            case 'medium':
                cellsToRemove = 50; // 中等：保留31个数字
                break;
            case 'hard':
                cellsToRemove = 60; // 困难：保留21个数字
                break;
            default:
                cellsToRemove = 50;
        }
        
        // 随机移除数字
        const indices = Array.from({length: 81}, (_, i) => i);
        shuffleArray(indices);
        
        for (let i = 0; i < cellsToRemove; i++) {
            const index = indices[i];
            board[index] = 0;
        }
        
        // 标记固定单元格
        for (let i = 0; i < 81; i++) {
            fixedCells[i] = board[i] !== 0;
        }
    }

    // 生成完整的数独解答
    function generateSolution() {
        // 初始化空解答
        solution = Array(81).fill(0);
        
        // 使用回溯算法填充解答
        solveSudoku(solution);
    }

    // 使用回溯算法解数独
    function solveSudoku(grid) {
        const emptyCell = findEmptyCell(grid);
        
        // 如果没有空单元格，说明解答完成
        if (!emptyCell) {
            return true;
        }
        
        const [row, col] = emptyCell;
        const index = row * 9 + col;
        
        // 尝试填入1-9
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(numbers);
        
        for (let num of numbers) {
            // 检查是否可以放置数字
            if (isValidPlacement(grid, row, col, num)) {
                grid[index] = num;
                
                // 递归解决剩余部分
                if (solveSudoku(grid)) {
                    return true;
                }
                
                // 如果无法解决，回溯
                grid[index] = 0;
            }
        }
        
        return false;
    }

    // 查找空单元格
    function findEmptyCell(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const index = row * 9 + col;
                if (grid[index] === 0) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    // 检查数字放置是否有效
    function isValidPlacement(grid, row, col, num) {
        // 检查行
        for (let c = 0; c < 9; c++) {
            if (grid[row * 9 + c] === num) {
                return false;
            }
        }
        
        // 检查列
        for (let r = 0; r < 9; r++) {
            if (grid[r * 9 + col] === num) {
                return false;
            }
        }
        
        // 检查3x3方格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (grid[(boxRow + r) * 9 + (boxCol + c)] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // 更新游戏板界面
    function updateBoard() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            // 清除所有类和内容
            cell.classList.remove('fixed', 'selected', 'highlighted', 'error', 'same-number');
            
            // 清除笔记
            const notes = cell.querySelectorAll('.note');
            notes.forEach(note => note.textContent = '');
            
            // 设置数字
            const value = board[index];
            
            if (value !== 0) {
                cell.textContent = value;
                
                // 标记固定单元格
                if (fixedCells[index]) {
                    cell.classList.add('fixed');
                }
            } else {
                cell.textContent = '';
                
                // 恢复笔记容器
                const notesContainer = document.createElement('div');
                notesContainer.classList.add('notes-container');
                
                for (let j = 1; j <= 9; j++) {
                    const note = document.createElement('div');
                    note.classList.add('note');
                    note.dataset.note = j;
                    notesContainer.appendChild(note);
                }
                
                cell.innerHTML = '';
                cell.appendChild(notesContainer);
            }
        });
        
        // 如果有选中的单元格，重新高亮
        if (selectedCell !== null) {
            highlightCell(selectedCell);
        }
    }

    // 选择单元格
    function selectCell(index) {
        // 如果是固定单元格，不允许选择
        if (fixedCells[index]) {
            return;
        }
        
        // 清除之前的高亮
        clearHighlights();
        
        // 设置新的选中单元格
        selectedCell = index;
        
        // 高亮相关单元格
        highlightCell(index);
    }

    // 高亮单元格及相关单元格
    function highlightCell(index) {
        const cells = document.querySelectorAll('.cell');
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        const value = board[index];
        
        // 高亮选中的单元格
        cells[index].classList.add('selected');
        
        // 高亮同一行、同一列和同一个3x3方格的单元格
        for (let i = 0; i < 81; i++) {
            const r = Math.floor(i / 9);
            const c = i % 9;
            const br = Math.floor(r / 3) * 3;
            const bc = Math.floor(c / 3) * 3;
            
            if (r === row || c === col || (br === boxRow && bc === boxCol)) {
                cells[i].classList.add('highlighted');
            }
            
            // 高亮相同数字
            if (value !== 0 && board[i] === value) {
                cells[i].classList.add('same-number');
            }
        }
    }

    // 清除所有高亮
    function clearHighlights() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            cell.classList.remove('selected', 'highlighted', 'same-number');
        });
        
        selectedCell = null;
    }

    // 输入数字
    function enterNumber(number) {
        if (selectedCell === null || fixedCells[selectedCell]) {
            return;
        }
        
        const cell = document.querySelectorAll('.cell')[selectedCell];
        
        if (isNotesMode && number !== '0') {
            // 笔记模式
            toggleNote(cell, number);
        } else {
            // 正常模式
            if (number === '0') {
                // 清除数字
                board[selectedCell] = 0;
                cell.textContent = '';
                
                // 恢复笔记容器
                const notesContainer = document.createElement('div');
                notesContainer.classList.add('notes-container');
                
                for (let j = 1; j <= 9; j++) {
                    const note = document.createElement('div');
                    note.classList.add('note');
                    note.dataset.note = j;
                    notesContainer.appendChild(note);
                }
                
                cell.innerHTML = '';
                cell.appendChild(notesContainer);
            } else {
                // 输入数字
                board[selectedCell] = parseInt(number);
                cell.innerHTML = number;
                
                // 检查是否有错误
                checkCellError(selectedCell);
                
                // 检查是否完成游戏
                if (isBoardFilled()) {
                    checkSolution();
                }
            }
            
            // 重新高亮相关单元格
            highlightCell(selectedCell);
        }
    }

    // 切换笔记
    function toggleNote(cell, number) {
        const note = cell.querySelector(`.note[data-note="${number}"]`);
        
        if (note.textContent === number) {
            note.textContent = '';
        } else {
            note.textContent = number;
        }
    }

    // 检查单元格是否有错误
    function checkCellError(index) {
        const cells = document.querySelectorAll('.cell');
        const value = board[index];
        
        if (value === 0) {
            cells[index].classList.remove('error');
            return false;
        }
        
        const row = Math.floor(index / 9);
        const col = index % 9;
        let hasError = false;
        
        // 检查行
        for (let c = 0; c < 9; c++) {
            const i = row * 9 + c;
            if (i !== index && board[i] === value) {
                hasError = true;
                break;
            }
        }
        
        // 检查列
        if (!hasError) {
            for (let r = 0; r < 9; r++) {
                const i = r * 9 + col;
                if (i !== index && board[i] === value) {
                    hasError = true;
                    break;
                }
            }
        }
        
        // 检查3x3方格
        if (!hasError) {
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const i = (boxRow + r) * 9 + (boxCol + c);
                    if (i !== index && board[i] === value) {
                        hasError = true;
                        break;
                    }
                }
                if (hasError) break;
            }
        }
        
        // 标记错误
        if (hasError) {
            cells[index].classList.add('error');
        } else {
            cells[index].classList.remove('error');
        }
        
        return hasError;
    }

    // 检查整个游戏板是否有错误
    function checkBoardErrors() {
        let hasErrors = false;
        
        for (let i = 0; i < 81; i++) {
            if (board[i] !== 0 && checkCellError(i)) {
                hasErrors = true;
            }
        }
        
        return hasErrors;
    }

    // 检查游戏板是否已填满
    function isBoardFilled() {
        return !board.includes(0);
    }

    // 检查解答
    function checkSolution() {
        if (checkBoardErrors()) {
            // 有错误
            showMessage('检查结果', '数独中存在错误，请修正后再试。');
        } else if (!isBoardFilled()) {
            // 未填满
            showMessage('检查结果', '数独尚未填满，请继续完成。');
        } else {
            // 完成游戏
            clearInterval(timerInterval);
            showMessage('恭喜！', `你成功完成了数独！\n用时：${formatTime(seconds)}\n使用提示：${hintsUsed}次`);
        }
    }

    // 显示解答
    function showSolution() {
        // 确认是否要查看解答
        if (confirm('确定要查看解答吗？这将结束当前游戏。')) {
            board = [...solution];
            updateBoard();
            clearInterval(timerInterval);
            showMessage('游戏结束', '这是完整的解答。');
        }
    }

    // 提供提示
    function giveHint() {
        if (selectedCell === null) {
            showMessage('提示', '请先选择一个单元格。');
            return;
        }
        
        if (fixedCells[selectedCell]) {
            showMessage('提示', '这是初始数字，不能修改。');
            return;
        }
        
        if (board[selectedCell] === solution[selectedCell]) {
            showMessage('提示', '这个单元格已经是正确的数字。');
            return;
        }
        
        // 提供正确的数字
        board[selectedCell] = solution[selectedCell];
        hintsUsed++;
        updateBoard();
        highlightCell(selectedCell);
    }

    // 切换笔记模式
    function toggleNotesMode() {
        isNotesMode = !isNotesMode;
        notesToggle.classList.toggle('active', isNotesMode);
    }

    // 处理键盘输入
    function handleKeyDown(e) {
        if (selectedCell === null) return;
        
        if (e.key >= '1' && e.key <= '9') {
            enterNumber(e.key);
        } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
            enterNumber('0');
        } else if (e.key === 'n') {
            toggleNotesMode();
        } else if (e.key === 'ArrowUp' && selectedCell >= 9) {
            selectCell(selectedCell - 9);
        } else if (e.key === 'ArrowDown' && selectedCell < 72) {
            selectCell(selectedCell + 9);
        } else if (e.key === 'ArrowLeft' && selectedCell % 9 > 0) {
            selectCell(selectedCell - 1);
        } else if (e.key === 'ArrowRight' && selectedCell % 9 < 8) {
            selectCell(selectedCell + 1);
        }
    }

    // 开始计时器
    function startTimer() {
        clearInterval(timerInterval);
        seconds = 0;
        updateTimer();
        
        timerInterval = setInterval(() => {
            seconds++;
            updateTimer();
        }, 1000);
    }

    // 更新计时器显示
    function updateTimer() {
        timerElement.textContent = formatTime(seconds);
    }

    // 格式化时间
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 显示消息
    function showMessage(title, text) {
        messageTitle.textContent = title;
        messageText.textContent = text;
        gameMessage.style.display = 'flex';
    }

    // 打乱数组
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 初始化游戏
    initGame();
});