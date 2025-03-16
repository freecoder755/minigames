document.addEventListener('DOMContentLoaded', function() {
    // 初始化拖拽排序
    const gameGrid = document.getElementById('game-grid');
    new Sortable(gameGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function() {
            // 保存排序顺序到本地存储
            saveGameOrder();
        }
    });

    // 为每个游戏卡片添加点击事件
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const game = this.getAttribute('data-game');
            navigateToGame(game);
        });
    });

    // 从本地存储加载游戏顺序
    loadGameOrder();
});

// 保存游戏顺序到本地存储
function saveGameOrder() {
    const gameCards = document.querySelectorAll('.game-card');
    const order = Array.from(gameCards).map(card => card.getAttribute('data-game'));
    localStorage.setItem('gameOrder', JSON.stringify(order));
}

// 从本地存储加载游戏顺序
function loadGameOrder() {
    const savedOrder = localStorage.getItem('gameOrder');
    if (savedOrder) {
        try {
            const order = JSON.parse(savedOrder);
            const gameGrid = document.getElementById('game-grid');
            
            // 根据保存的顺序重新排列游戏卡片
            order.forEach(game => {
                const card = document.querySelector(`.game-card[data-game="${game}"]`);
                if (card) {
                    gameGrid.appendChild(card);
                }
            });
        } catch (e) {
            console.error('加载游戏顺序时出错:', e);
        }
    }
}

// 导航到游戏页面
function navigateToGame(game) {
    const gamePaths = {
        'minesweeper': 'games/minesweeper/index.html',
        'sudoku': 'games/sudoku/index.html',
        'blackjack': 'games/blackjack/index.html',
        'snake': 'games/snake/index.html'
    };

    const path = gamePaths[game];
    if (path) {
        window.location.href = path;
    } else {
        alert('游戏正在开发中，敬请期待！');
    }
} 