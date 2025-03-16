document.addEventListener('DOMContentLoaded', function() {
    // 获取游戏元素
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const newGameBtn = document.getElementById('new-game-btn');
    const speedSelect = document.getElementById('speed-select');
    const gameMessage = document.getElementById('game-message');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const messageButton = document.getElementById('message-button');
    
    // 移动端控制按钮
    const upBtn = document.getElementById('up-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const downBtn = document.getElementById('down-btn');
    
    // 游戏配置
    const gridSize = 20; // 每个网格的大小（像素）
    let width = 600;
    let height = 400;
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameSpeed = 150; // 默认速度（毫秒）
    let gameInterval;
    let isPaused = false;
    let isGameOver = false;
    
    // 设置画布大小
    function setupCanvas() {
        // 根据屏幕大小调整画布
        if (window.innerWidth < 600) {
            width = Math.floor((window.innerWidth - 40) / gridSize) * gridSize;
            height = Math.floor(width * 2/3 / gridSize) * gridSize;
        }
        
        canvas.width = width;
        canvas.height = height;
    }
    
    // 初始化游戏
    function initGame() {
        setupCanvas();
        highScoreElement.textContent = highScore;
        resetGame();
    }
    
    // 重置游戏
    function resetGame() {
        clearInterval(gameInterval);
        
        // 初始化蛇
        snake = [
            {x: 6 * gridSize, y: 10 * gridSize},
            {x: 5 * gridSize, y: 10 * gridSize},
            {x: 4 * gridSize, y: 10 * gridSize}
        ];
        
        // 设置方向
        direction = 'right';
        nextDirection = 'right';
        
        // 生成食物
        generateFood();
        
        // 重置分数
        score = 0;
        scoreElement.textContent = score;
        
        // 设置游戏速度
        setGameSpeed();
        
        // 开始游戏循环
        gameInterval = setInterval(gameLoop, gameSpeed);
        
        // 重置游戏状态
        isPaused = false;
        isGameOver = false;
        
        // 隐藏游戏消息
        gameMessage.style.display = 'none';
    }
    
    // 设置游戏速度
    function setGameSpeed() {
        const speed = speedSelect.value;
        switch(speed) {
            case 'slow':
                gameSpeed = 200;
                break;
            case 'medium':
                gameSpeed = 150;
                break;
            case 'fast':
                gameSpeed = 100;
                break;
            default:
                gameSpeed = 150;
        }
        
        // 如果游戏正在运行，更新间隔
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }
    
    // 生成食物
    function generateFood() {
        // 计算可用的网格数
        const gridWidth = width / gridSize;
        const gridHeight = height / gridSize;
        
        // 随机生成食物位置
        let foodX, foodY;
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            foodX = Math.floor(Math.random() * gridWidth) * gridSize;
            foodY = Math.floor(Math.random() * gridHeight) * gridSize;
            
            // 检查食物是否在蛇身上
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === foodX && snake[i].y === foodY) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        food = {x: foodX, y: foodY};
    }
    
    // 游戏主循环
    function gameLoop() {
        if (isPaused || isGameOver) return;
        
        // 更新蛇的位置
        updateSnake();
        
        // 检查碰撞
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // 检查是否吃到食物
        checkFood();
        
        // 绘制游戏
        drawGame();
        
        // 更新方向
        direction = nextDirection;
    }
    
    // 更新蛇的位置
    function updateSnake() {
        // 获取蛇头位置
        const head = {x: snake[0].x, y: snake[0].y};
        
        // 根据方向移动蛇头
        switch(direction) {
            case 'up':
                head.y -= gridSize;
                break;
            case 'down':
                head.y += gridSize;
                break;
            case 'left':
                head.x -= gridSize;
                break;
            case 'right':
                head.x += gridSize;
                break;
        }
        
        // 将新的头部添加到蛇的前面
        snake.unshift(head);
        
        // 如果没有吃到食物，移除尾部
        if (head.x !== food.x || head.y !== food.y) {
            snake.pop();
        }
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
            return true;
        }
        
        // 检查是否撞到自己
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查是否吃到食物
    function checkFood() {
        const head = snake[0];
        
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score++;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新的食物
            generateFood();
        }
    }
    
    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制蛇
        ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < snake.length; i++) {
            ctx.fillRect(snake[i].x, snake[i].y, gridSize, gridSize);
            
            // 绘制蛇身边框
            ctx.strokeStyle = '#45a049';
            ctx.strokeRect(snake[i].x, snake[i].y, gridSize, gridSize);
        }
        
        // 绘制蛇头
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(snake[0].x, snake[0].y, gridSize, gridSize);
        
        // 绘制食物
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(
            food.x + gridSize/2, 
            food.y + gridSize/2, 
            gridSize/2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        isGameOver = true;
        
        // 显示游戏结束消息
        messageTitle.textContent = '游戏结束';
        messageText.textContent = `你的得分: ${score}`;
        gameMessage.style.display = 'flex';
    }
    
    // 暂停/继续游戏
    function togglePause() {
        if (isGameOver) return;
        
        isPaused = !isPaused;
        
        if (isPaused) {
            clearInterval(gameInterval);
            messageTitle.textContent = '游戏暂停';
            messageText.textContent = '按 P 键或点击下方按钮继续游戏';
            gameMessage.style.display = 'flex';
        } else {
            gameInterval = setInterval(gameLoop, gameSpeed);
            gameMessage.style.display = 'none';
        }
    }
    
    // 处理键盘输入
    function handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case 'p':
            case 'P':
                togglePause();
                break;
        }
    }
    
    // 事件监听
    document.addEventListener('keydown', handleKeyDown);
    
    // 移动端控制按钮
    upBtn.addEventListener('click', function() {
        if (direction !== 'down') nextDirection = 'up';
    });
    
    downBtn.addEventListener('click', function() {
        if (direction !== 'up') nextDirection = 'down';
    });
    
    leftBtn.addEventListener('click', function() {
        if (direction !== 'right') nextDirection = 'left';
    });
    
    rightBtn.addEventListener('click', function() {
        if (direction !== 'left') nextDirection = 'right';
    });
    
    // 新游戏按钮
    newGameBtn.addEventListener('click', resetGame);
    
    // 消息按钮
    messageButton.addEventListener('click', function() {
        if (isPaused) {
            togglePause();
        } else {
            resetGame();
        }
    });
    
    // 速度选择
    speedSelect.addEventListener('change', setGameSpeed);
    
    // 窗口大小改变时调整画布
    window.addEventListener('resize', function() {
        setupCanvas();
        drawGame();
    });
    
    // 初始化游戏
    initGame();
});