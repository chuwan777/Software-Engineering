// 导入通用数据文件
const { connectWordsData, gameConfig } = require('../data/common-data.js');

Page({
  data: {
    // 游戏配置
    gameConfig: gameConfig.connectWords,  // 从通用数据获取配置
    
    // 游戏数据
    candidateWords: [],  // 候选汉字（打乱）
    selectedWords: [],   // 用户选择的字序列
    usedIndices: [],     // 已使用的候选字索引
    correctPoem: '',     // 正确诗句
    isAnswered: false,
    isCorrect: false,
    isLoading: true,
    startTime: 0,       // 游戏开始时间（时间戳）
    usedTime: 0,        // 已用时间（秒）
    timer: null,        // 计时定时器
    score: 0,           // 当前得分
    hintCount: 0,       // 已使用提示次数
    consecutiveCorrect: 0, // 连续答对次数
    totalPoems: connectWordsData.length,  // 总诗句数
    currentPoemIndex: 0,       // 当前诗句索引
    currentPoemInfo: null,     // 当前诗句信息
    hasError: false,    // 错误状态
    errorMsg: '',       // 错误信息
    // 静态诗句库
    poemBank: [
      {
        correctPoem: "床前明月光",
        shuffledWords: ["明", "月", "光", "床", "前"],
        author: "李白",
        title: "静夜思"
      },
      {
        correctPoem: "疑是地上霜",
        shuffledWords: ["疑", "是", "地", "上", "霜"],
        author: "李白",
        title: "静夜思"
      },
      {
        correctPoem: "举头望明月",
        shuffledWords: ["举", "头", "望", "明", "月"],
        author: "李白",
        title: "静夜思"
      },
      {
        correctPoem: "低头思故乡",
        shuffledWords: ["低", "头", "思", "故", "乡"],
        author: "李白",
        title: "静夜思"
      },
      {
        correctPoem: "白日依山尽",
        shuffledWords: ["白", "日", "依", "山", "尽"],
        author: "王之涣",
        title: "登鹳雀楼"
      },
      {
        correctPoem: "黄河入海流",
        shuffledWords: ["黄", "河", "入", "海", "流"],
        author: "王之涣",
        title: "登鹳雀楼"
      },
      {
        correctPoem: "欲穷千里目",
        shuffledWords: ["欲", "穷", "千", "里", "目"],
        author: "王之涣",
        title: "登鹳雀楼"
      },
      {
        correctPoem: "更上一层楼",
        shuffledWords: ["更", "上", "一", "层", "楼"],
        author: "王之涣",
        title: "登鹳雀楼"
      },
      {
        correctPoem: "春眠不觉晓",
        shuffledWords: ["春", "眠", "不", "觉", "晓"],
        author: "孟浩然",
        title: "春晓"
      },
      {
        correctPoem: "处处闻啼鸟",
        shuffledWords: ["处", "处", "闻", "啼", "鸟"],
        author: "孟浩然",
        title: "春晓"
      },
      {
        correctPoem: "夜来风雨声",
        shuffledWords: ["夜", "来", "风", "雨", "声"],
        author: "孟浩然",
        title: "春晓"
      },
      {
        correctPoem: "花落知多少",
        shuffledWords: ["花", "落", "知", "多", "少"],
        author: "孟浩然",
        title: "春晓"
      }
    ]
  },

  onLoad() {
    this.initGame();
  },

  // 初始化游戏
  initGame() {
    this.setData({ isLoading: true, hasError: false, errorMsg: '' });

    // 清除之前的定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }

    try {
      // 验证数据是否存在
      if (!connectWordsData || connectWordsData.length === 0) {
        throw new Error('诗句数据加载失败，请重试');
      }

      // 从通用数据中随机选择一首诗
      const randomIndex = Math.floor(Math.random() * connectWordsData.length);
      const selectedPoem = connectWordsData[randomIndex];

      // 验证诗句数据完整性
      if (!selectedPoem || !selectedPoem.correctPoem || !selectedPoem.shuffledWords) {
        throw new Error('诗句数据格式错误，请重试');
      }

      // 模拟加载延迟
      setTimeout(() => {
        // 打乱汉字顺序
        const shuffled = [...selectedPoem.correctPoem].sort(() => Math.random() - 0.5);
        
        this.setData({
          candidateWords: shuffled,
          correctPoem: selectedPoem.correctPoem,
          selectedWords: [],
          usedIndices: [],
          isLoading: false,
          isAnswered: false,
          isCorrect: false,
          hintCount: 0,
          startTime: Date.now(),
          usedTime: 0,
          currentPoem: selectedPoem, // 保存当前诗句信息
          currentPoemIndex: randomIndex,
          currentPoemInfo: selectedPoem
        });
        
        // 开始计时
        this.startTimer();
      }, 500); // 500ms加载动画
    } catch (error) {
      console.error('游戏初始化错误:', error);
      this.setData({
        isLoading: false,
        hasError: true,
        errorMsg: error.message || '游戏初始化失败，请重试'
      });
    }
  },

  // 开始计时
  startTimer() {
    const timer = setInterval(() => {
      const usedTime = Math.floor((Date.now() - this.data.startTime) / 1000);
      this.setData({ usedTime });
    }, 1000);
    
    this.setData({ timer });
  },

  // 选择候选字
  selectWord(e) {
    try {
      const { index } = e.currentTarget.dataset;
      const { candidateWords, selectedWords, usedIndices, isAnswered, isLoading, hasError } = this.data;
      
      if (isAnswered || isLoading || hasError) return;
      if (usedIndices.includes(index)) {
        wx.showToast({ title: '该字已使用', icon: 'none' });
        return;
      }
      
      this.setData({
        selectedWords: [...selectedWords, candidateWords[index]],
        usedIndices: [...usedIndices, index]
      });
    } catch (error) {
      console.error('选择字错误:', error);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  },

  // 移除已选字
  removeWord(e) {
    try {
      const { index } = e.currentTarget.dataset;
      const { selectedWords, usedIndices, isAnswered, isLoading, hasError } = this.data;
      
      if (isAnswered || isLoading || hasError) return;
      if (index < 0 || index >= selectedWords.length) {
        return;
      }

      this.setData({
        selectedWords: selectedWords.filter((_, i) => i !== index),
        usedIndices: usedIndices.filter((_, i) => i !== index)
      });
    } catch (error) {
      console.error('移除字错误:', error);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  },

  // 提交答案
  submitAnswer() {
    const { selectedWords, correctPoem, usedTime, hintCount, consecutiveCorrect, gameConfig } = this.data;
    
    if (selectedWords.length !== correctPoem.length) {
      wx.showToast({
        title: `请选择${correctPoem.length}个字`,
        icon: 'none'
      });
      return;
    }

    const userPoem = selectedWords.join('');
    const isCorrect = userPoem === correctPoem;
    
    // 停止计时
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    // 保存当前得分用于计算本次得分
    const prevScore = this.data.score;
    
    // 计算得分
    let newScore = this.data.score;
    let newConsecutiveCorrect = consecutiveCorrect;
    
    if (isCorrect) {
      // 基础分数减去时间惩罚和提示惩罚
      const timePenaltyValue = Math.min(usedTime * gameConfig.timePenalty, gameConfig.baseScore * 0.7);
      const hintPenaltyValue = hintCount * gameConfig.hintPenalty;
      const finalScore = Math.max(10, gameConfig.baseScore - timePenaltyValue - hintPenaltyValue);
      
      // 连续答对奖励
      newConsecutiveCorrect += 1;
      const consecutiveBonus = Math.min(newConsecutiveCorrect * gameConfig.consecutiveBonus, 50);
      
      newScore += finalScore + consecutiveBonus;
    } else {
      // 答错重置连续答对次数
      newConsecutiveCorrect = 0;
    }
    
    this.setData({
      isAnswered: true,
      isCorrect,
      score: newScore,
      consecutiveCorrect: newConsecutiveCorrect,
      prevScore: prevScore
    });
  },

  // 提示功能
  showHint() {
    const { selectedWords, correctPoem, hintCount, gameConfig, isAnswered } = this.data;
    
    if (isAnswered) return;
    
    if (hintCount >= gameConfig.maxHints) {
      wx.showToast({
        title: `已用完${gameConfig.maxHints}次提示机会`,
        icon: 'none'
      });
      return;
    }
    
    // 找出下一个正确的字
    const nextIndex = selectedWords.length;
    const nextCorrectWord = correctPoem[nextIndex];
    
    // 显示提示
    wx.showModal({
      title: '提示',
      content: `第${nextIndex + 1}个字是：${nextCorrectWord}`,
      showCancel: false
    });
    
    // 更新提示次数
    this.setData({ hintCount: hintCount + 1 });
  },

  // 重新开始
  restartGame() {
    this.initGame();
  },

  // 页面卸载时清理资源
  onUnload() {
    // 清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  // 页面隐藏时暂停游戏
  onHide() {
    // 暂停定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  // 页面显示时恢复游戏
  onShow() {
    // 如果游戏进行中且计时器未运行，重新开始计时
    if (!this.data.isAnswered && !this.data.isLoading && !this.data.timer) {
      this.startTimer();
    }
  }
});