document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const balanceElement = document.getElementById('balance');
    const betAmountInput = document.getElementById('bet-amount');
    const placeBetBtn = document.getElementById('place-bet-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const doubleBtn = document.getElementById('double-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const dealerCardsElement = document.getElementById('dealer-cards');
    const playerCardsElement = document.getElementById('player-cards');
    const dealerScoreElement = document.getElementById('dealer-score');
    const playerScoreElement = document.getElementById('player-score');
    const gameMessageElement = document.getElementById('game-message');
    const gamePopup = document.getElementById('game-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupButton = document.getElementById('popup-button');

    // 游戏状态
    let deck = []; // 牌组
    let dealerCards = []; // 庄家的牌
    let playerCards = []; // 玩家的牌
    let dealerScore = 0; // 庄家得分
    let playerScore = 0; // 玩家得分
    let balance = 1000; // 玩家余额
    let currentBet = 0; // 当前下注金额
    let gameInProgress = false; // 游戏是否进行中
    let dealerTurn = false; // 是否轮到庄家
    
    // 初始化游戏
    function initGame() {
        // 从本地存储加载余额
        const savedBalance = localStorage.getItem('blackjackBalance');
        if (savedBalance) {
            balance = parseInt(savedBalance);
        }
        
        updateBalance();
        
        // 事件监听
        placeBetBtn.addEventListener('click', placeBet);
        hitBtn.addEventListener('click', hit);
        standBtn.addEventListener('click', stand);
        doubleBtn.addEventListener('click', doubleBet);
        newGameBtn.addEventListener('click', startNewGame);
        popupButton.addEventListener('click', closePopup);
        
        // 设置下注金额的最大值
        updateBetInput();
    }
    
    // 更新余额显示
    function updateBalance() {
        balanceElement.textContent = balance;
        localStorage.setItem('blackjackBalance', balance);
    }
    
    // 更新下注输入框
    function updateBetInput() {
        betAmountInput.max = balance;
        betAmountInput.value = Math.min(50, balance);
    }
    
    // 创建新的牌组
    function createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        deck = [];
        
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        
        // 洗牌
        shuffleDeck();
    }
    
    // 洗牌
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    // 发牌
    function dealCard(isHidden = false) {
        if (deck.length === 0) {
            createDeck(); // 如果牌组空了，创建新牌组
        }
        
        const card = deck.pop();
        card.hidden = isHidden;
        return card;
    }
    
    // 计算牌的点数
    function getCardValue(card) {
        const value = card.value;
        if (value === 'A') {
            return 11; // A 默认为11点
        } else if (value === 'K' || value === 'Q' || value === 'J') {
            return 10; // K, Q, J 为10点
        } else {
            return parseInt(value); // 其他牌按面值计算
        }
    }
    
    // 计算手牌总点数
    function calculateScore(cards) {
        let score = 0;
        let aces = 0;
        
        for (let card of cards) {
            if (!card.hidden) { // 只计算可见牌的点数
                const value = getCardValue(card);
                score += value;
                
                // 记录A的数量
                if (card.value === 'A') {
                    aces++;
                }
            }
        }
        
        // 如果总点数超过21点，将A当作1点计算
        while (score > 21 && aces > 0) {
            score -= 10; // 11 - 1 = 10
            aces--;
        }
        
        return score;
    }
    
    // 创建牌的HTML元素
    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        
        if (card.hidden) {
            cardElement.classList.add('hidden');
            return cardElement;
        }
        
        cardElement.classList.add(card.suit);
        
        // 设置花色符号
        let suitSymbol;
        switch (card.suit) {
            case 'hearts':
                suitSymbol = '♥';
                break;
            case 'diamonds':
                suitSymbol = '♦';
                break;
            case 'clubs':
                suitSymbol = '♣';
                break;
            case 'spades':
                suitSymbol = '♠';
                break;
        }
        
        // 创建牌的内容
        const cardTop = document.createElement('div');
        cardTop.classList.add('card-top');
        cardTop.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${suitSymbol}</div>
        `;
        
        const cardCenter = document.createElement('div');
        cardCenter.classList.add('card-center');
        cardCenter.textContent = suitSymbol;
        
        const cardBottom = document.createElement('div');
        cardBottom.classList.add('card-bottom');
        cardBottom.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${suitSymbol}</div>
        `;
        
        cardElement.appendChild(cardTop);
        cardElement.appendChild(cardCenter);
        cardElement.appendChild(cardBottom);
        
        return cardElement;
    }
    
    // 更新牌面显示
    function updateCards() {
        // 清空牌面
        dealerCardsElement.innerHTML = '';
        playerCardsElement.innerHTML = '';
        
        // 显示庄家的牌
        for (let card of dealerCards) {
            const cardElement = createCardElement(card);
            dealerCardsElement.appendChild(cardElement);
        }
        
        // 显示玩家的牌
        for (let card of playerCards) {
            const cardElement = createCardElement(card);
            playerCardsElement.appendChild(cardElement);
        }
        
        // 更新分数
        dealerScore = calculateScore(dealerCards);
        playerScore = calculateScore(playerCards);
        
        dealerScoreElement.textContent = dealerTurn || !gameInProgress ? dealerScore : '?';
        playerScoreElement.textContent = playerScore;
    }
    
    // 下注
    function placeBet() {
        const betAmount = parseInt(betAmountInput.value);
        
        if (isNaN(betAmount) || betAmount <= 0 || betAmount > balance) {
            showPopup('错误', '请输入有效的下注金额！');
            return;
        }
        
        // 扣除下注金额
        balance -= betAmount;
        currentBet = betAmount;
        updateBalance();
        
        // 开始游戏
        startGame();
    }
    
    // 开始游戏
    function startGame() {
        gameInProgress = true;
        dealerTurn = false;
        
        // 创建新牌组
        createDeck();
        
        // 清空手牌
        dealerCards = [];
        playerCards = [];
        
        // 发牌
        dealerCards.push(dealCard()); // 庄家第一张牌（明牌）
        dealerCards.push(dealCard(true)); // 庄家第二张牌（暗牌）
        playerCards.push(dealCard()); // 玩家第一张牌
        playerCards.push(dealCard()); // 玩家第二张牌
        
        // 更新牌面
        updateCards();
        
        // 更新按钮状态
        placeBetBtn.disabled = true;
        betAmountInput.disabled = true;
        hitBtn.disabled = false;
        standBtn.disabled = false;
        doubleBtn.disabled = balance >= currentBet; // 只有余额足够时才能加倍
        newGameBtn.disabled = true;
        
        // 检查是否有黑杰克
        checkBlackjack();
    }
    
    // 检查是否有黑杰克
    function checkBlackjack() {
        const playerHasBlackjack = playerScore === 21 && playerCards.length === 2;
        const dealerHasBlackjack = calculateScore([dealerCards[0], dealerCards[1]]) === 21;
        
        if (playerHasBlackjack || dealerHasBlackjack) {
            // 揭示庄家的暗牌
            dealerCards[1].hidden = false;
            dealerTurn = true;
            updateCards();
            
            if (playerHasBlackjack && dealerHasBlackjack) {
                // 双方都有黑杰克，平局
                gameMessageElement.textContent = '双方都有黑杰克！平局！';
                endGame('平局', '双方都有黑杰克！您的下注金额已返还。');
                balance += currentBet;
            } else if (playerHasBlackjack) {
                // 玩家有黑杰克，赔率1.5倍
                gameMessageElement.textContent = '黑杰克！您赢了！';
                endGame('黑杰克！', '恭喜！您获得了1.5倍赔率的奖励！');
                balance += currentBet * 2.5; // 返还本金 + 1.5倍赔率
            } else {
                // 庄家有黑杰克，玩家输
                gameMessageElement.textContent = '庄家有黑杰克！您输了！';
                endGame('庄家黑杰克', '很遗憾，庄家获得了黑杰克。');
            }
            
            updateBalance();
        }
    }
    
    // 要牌
    function hit() {
        if (!gameInProgress || dealerTurn) return;
        
        // 玩家抽一张牌
        playerCards.push(dealCard());
        updateCards();
        
        // 禁用加倍按钮（只能在最初两张牌时加倍）
        doubleBtn.disabled = true;
        
        // 检查是否爆牌
        if (playerScore > 21) {
            gameMessageElement.textContent = '爆牌！您输了！';
            endGame('爆牌', '很遗憾，您的点数超过了21点。');
        }
    }
    
    // 停牌
    function stand() {
        if (!gameInProgress || dealerTurn) return;
        
        dealerTurn = true;
        
        // 揭示庄家的暗牌
        dealerCards[1].hidden = false;
        updateCards();
        
        // 庄家按规则要牌（小于17点必须要牌）
        dealerPlay();
    }
    
    // 加倍
    function doubleBet() {
        if (!gameInProgress || dealerTurn || playerCards.length > 2 || balance < currentBet) return;
        
        // 加倍下注
        balance -= currentBet;
        currentBet *= 2;
        updateBalance();
        
        // 玩家再抽一张牌后停牌
        playerCards.push(dealCard());
        updateCards();
        
        // 检查是否爆牌
        if (playerScore > 21) {
            gameMessageElement.textContent = '爆牌！您输了！';
            endGame('爆牌', '很遗憾，您的点数超过了21点。');
        } else {
            // 如果没爆牌，轮到庄家
            dealerTurn = true;
            
            // 揭示庄家的暗牌
            dealerCards[1].hidden = false;
            updateCards();
            
            // 庄家按规则要牌
            dealerPlay();
        }
    }
    
    // 庄家按规则要牌
    function dealerPlay() {
        // 使用setTimeout创建动画效果
        const dealerPlayStep = function() {
            if (dealerScore < 17) {
                // 庄家点数小于17，继续要牌
                dealerCards.push(dealCard());
                updateCards();
                
                // 继续检查
                setTimeout(dealerPlayStep, 700);
            } else {
                // 庄家点数大于等于17，停牌并结算
                determineWinner();
            }
        };
        
        setTimeout(dealerPlayStep, 700);
    }
    
    // 判断胜负
    function determineWinner() {
        let message = '';
        let title = '';
        let popupMsg = '';
        
        if (dealerScore > 21) {
            // 庄家爆牌，玩家胜
            message = '庄家爆牌！您赢了！';
            title = '胜利';
            popupMsg = '庄家爆牌！您赢得了下注金额的奖励。';
            balance += currentBet * 2; // 返还本金 + 赢得等额奖励
        } else if (playerScore > dealerScore) {
            // 玩家点数大于庄家，玩家胜
            message = '您的点数更高！您赢了！';
            title = '胜利';
            popupMsg = '您的点数高于庄家！您赢得了下注金额的奖励。';
            balance += currentBet * 2; // 返还本金 + 赢得等额奖励
        } else if (playerScore < dealerScore) {
            // 玩家点数小于庄家，庄家胜
            message = '庄家点数更高！您输了！';
            title = '失败';
            popupMsg = '庄家的点数高于您。再接再厉！';
        } else {
            // 平局
            message = '平局！';
            title = '平局';
            popupMsg = '双方点数相同！您的下注金额已返还。';
            balance += currentBet; // 返还本金
        }
        
        gameMessageElement.textContent = message;
        endGame(title, popupMsg);
        updateBalance();
    }
    
    // 结束游戏
    function endGame(title, message) {
        gameInProgress = false;
        
        // 更新按钮状态
        hitBtn.disabled = true;
        standBtn.disabled = true;
        doubleBtn.disabled = true;
        newGameBtn.disabled = false;
        
        // 显示弹窗
        showPopup(title, message);
    }
    
    // 开始新游戏
    function startNewGame() {
        // 重置游戏状态
        gameInProgress = false;
        dealerTurn = false;
        currentBet = 0;
        
        // 清空牌面
        dealerCards = [];
        playerCards = [];
        updateCards();
        
        // 清空消息
        gameMessageElement.textContent = '';
        
        // 更新按钮状态
        placeBetBtn.disabled = false;
        betAmountInput.disabled = false;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        doubleBtn.disabled = true;
        newGameBtn.disabled = true;
        
        // 更新下注输入框
        updateBetInput();
    }
    
    // 显示弹窗
    function showPopup(title, message) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        gamePopup.style.display = 'flex';
    }
    
    // 关闭弹窗
    function closePopup() {
        gamePopup.style.display = 'none';
    }
    
    // 初始化游戏
    initGame();
});