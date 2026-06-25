// pages/park/fill-blank/fill-blank.js
const app = getApp();
// 导入本地数据文件和游戏配置
const localFillBlankData = require('./data');
const { gameConfig } = require('../data/common-data.js');

Page({
  data: {
    questions: [],        // 题目列表
    currentIndex: 0,      // 当前题目索引
    userAnswers: [],      // 用户答案
    isAnswered: false,    // 是否提交
    isCorrect: false,     // 是否正确
    isLoading: true,
    hasEmptyAnswer: true, // 加载状态
    // 新增难度选择和进度显示
    difficulty: 'easy',   // 默认简单难度
    difficulties: ['easy', 'medium', 'hard'],
    difficultyLabels: ['简单', '中等', '困难'],
    // 进度数据
    currentQuestionIndex: 0,
    totalQuestions: 0,
    correctCount: 0,
    accuracy: 0,          // 正确率百分比
    progressWidth: 0,     // 进度条宽度
    // 存储当前难度下的题目
    currentDifficultyPoems: [],
    // 游戏配置
    gameConfig: gameConfig.fillBlank,
    // 错误状态
    hasError: false,
    errorMsg: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('页面加载了');
    this.loadPoemsByDifficulty();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时的逻辑
  },

  // 根据难度加载题目
  loadPoemsByDifficulty() {
    this.setData({ isLoading: true, hasError: false, errorMsg: '' });
    try {
      // 验证数据是否存在
      if (!localFillBlankData || !Array.isArray(localFillBlankData)) {
        throw new Error('题目数据加载失败，请重试');
      }

      // 根据当前难度获取题目
      const filteredPoems = localFillBlankData.filter(poem => poem.difficulty === this.data.difficulty) || [];
      
      // 验证题目数据
      if (filteredPoems.length === 0) {
        throw new Error('该难度下暂无题目');
      }

      // 加载当前题目数据
      const currentQ = filteredPoems[0];
      const userAnswers = new Array(currentQ.blanks.length).fill('');
      // 使用与其他函数相同的空值检查逻辑
      const hasEmptyAnswer = userAnswers.some(ans => !ans || ans.trim() === '');

      // 计算进度条宽度
      const progressWidth = filteredPoems.length > 0 ? ((0 + 1) / filteredPoems.length) * 100 : 0;
      
      // 一次setData更新所有数据
      this.setData({
        questions: localFillBlankData,
        currentDifficultyPoems: filteredPoems,
        totalQuestions: filteredPoems.length,
        currentQuestionIndex: 0,
        correctCount: 0,
        accuracy: 0,          // 初始正确率为0%
        // 直接设置当前题目相关数据
        currentIndex: 0,
        userAnswers,
        isAnswered: false,
        isCorrect: false,
        hasEmptyAnswer,
        isLoading: false,
        progressWidth
      });
    } catch (error) {
      console.error('加载题目错误:', error);
      this.setData({
        isLoading: false,
        hasError: true,
        errorMsg: error.message || '题目加载失败，请重试'
      });
    }
  },

  // 加载当前索引的题目
  loadCurrentQuestion() {
    try {
      const { currentDifficultyPoems, currentQuestionIndex } = this.data;
      
      if (currentDifficultyPoems.length === 0) {
        throw new Error('题目列表为空');
      }
      
      if (currentQuestionIndex < 0 || currentQuestionIndex >= currentDifficultyPoems.length) {
        throw new Error('题目索引无效');
      }
      
      const currentQ = currentDifficultyPoems[currentQuestionIndex];
      
      // 验证题目数据完整性
      if (!currentQ || !currentQ.blanks || !Array.isArray(currentQ.blanks)) {
        throw new Error('题目数据格式错误');
      }
      
      const userAnswers = new Array(currentQ.blanks.length).fill('');
      // 使用与inputAnswer函数相同的空值检查逻辑
      const hasEmptyAnswer = userAnswers.some(ans => !ans || ans.trim() === '');
      
      // 计算进度条宽度
      const progressWidth = currentDifficultyPoems.length > 0 ? ((currentQuestionIndex + 1) / currentDifficultyPoems.length) * 100 : 0;
      
      this.setData({
        currentIndex: currentQuestionIndex,
        userAnswers,
        isAnswered: false,
        isCorrect: false,
        hasEmptyAnswer,
        progressWidth
      });
    } catch (error) {
      console.error('加载当前题目错误:', error);
      wx.showToast({ title: '题目加载失败，请重试', icon: 'none' });
      this.loadPoemsByDifficulty();
    }
  },

  // 切换难度
  changeDifficulty(e) {
    try {
      const { difficulty } = e.currentTarget.dataset;
      
      if (!this.data.difficulties.includes(difficulty)) {
        throw new Error('无效的难度等级');
      }
      
      this.setData({
        difficulty
      });
      
      // 显示切换提示
      const label = this.data.difficultyLabels[this.data.difficulties.indexOf(difficulty)];
      wx.showToast({ title: `切换到${label}难度`, icon: 'none' });
      
      // 重新加载题目
      this.loadPoemsByDifficulty();
    } catch (error) {
      console.error('切换难度错误:', error);
      wx.showToast({ title: '难度切换失败', icon: 'none' });
    }
  },

  // 下一题
  nextQuestion() {
    try {
      let { currentQuestionIndex, currentDifficultyPoems, totalQuestions } = this.data;
      currentQuestionIndex++;
      
      // 如果当前难度下的题目做完了，显示完成提示并回到第一题
      if (currentQuestionIndex >= currentDifficultyPoems.length) {
        wx.showModal({
          title: '完成',
          content: '恭喜你完成了所有题目！',
          showCancel: false,
          success: () => {
            currentQuestionIndex = 0;
            this.setData({ currentQuestionIndex });
            this.loadCurrentQuestion();
          }
        });
        return;
      }
      
      this.setData({
        currentQuestionIndex
      });
      
      this.loadCurrentQuestion();
    } catch (error) {
      console.error('下一题错误:', error);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  // 输入答案处理函数
  inputAnswer(e) {
    // 打印输入事件详情
    console.log('输入事件详情:', e);
    
    // 获取索引并转换为数字类型
    const index = Number(e.currentTarget.dataset.index);
    const value = e.detail.value;
    const { currentDifficultyPoems, currentQuestionIndex, userAnswers } = this.data;
    
    // 打印当前数据状态
    console.log('当前数据状态:', { index, value, userAnswers, currentQuestionIndex });
    
    // 验证索引和题目数据
    if (!currentDifficultyPoems || currentDifficultyPoems.length === 0 || currentQuestionIndex >= currentDifficultyPoems.length) {
      console.error('题目数据无效');
      wx.showToast({ title: '输入错误，请重试', icon: 'none' });
      return;
    }
    
    const currentQ = currentDifficultyPoems[currentQuestionIndex];
    
    // 验证用户输入索引是否有效
    if (isNaN(index) || index < 0 || index >= currentQ.blanks.length) {
      console.error('无效的输入索引');
      wx.showToast({ title: '输入错误，请重试', icon: 'none' });
      return;
    }
    
    // 确保tempAnswers数组长度与blanks长度相同
    const tempAnswers = new Array(currentQ.blanks.length).fill('');
    
    // 复制现有答案到新数组
    for (let i = 0; i < userAnswers.length; i++) {
      if (i < tempAnswers.length) {
        tempAnswers[i] = userAnswers[i] || '';
      }
    }
    
    // 打印临时数组初始状态
    console.log('临时数组初始状态:', tempAnswers);
    
    // 更新当前输入的答案
    tempAnswers[index] = value;
    
    // 打印临时数组更新后状态
    console.log('临时数组更新后状态:', tempAnswers);
    
    // 检查是否所有答案都已填写
    const hasEmpty = tempAnswers.some(ans => !ans || ans.trim() === '');
    
    // 打印是否有空答案
    console.log('是否有空答案:', hasEmpty);
    
    // 强制更新所有相关状态，确保UI同步
    console.log('准备更新数据:', { userAnswers: tempAnswers, hasEmptyAnswer: hasEmpty });
    this.setData({
      userAnswers: tempAnswers,
      hasEmptyAnswer: hasEmpty
    });
    // 立即打印更新后的数据
    console.log('数据更新完成:', { userAnswers: this.data.userAnswers, hasEmptyAnswer: this.data.hasEmptyAnswer });
  },

  // 提交答案
  submitAnswer() {
    try {
      const { currentDifficultyPoems, currentQuestionIndex, userAnswers, correctCount } = this.data;
      
      if (currentDifficultyPoems.length === 0 || currentQuestionIndex >= currentDifficultyPoems.length) {
        throw new Error('题目数据无效');
      }
      
      const currentQ = currentDifficultyPoems[currentQuestionIndex];
      
      // 验证答案（确保对比时去除前后空格，避免输入空格导致误判）
      const isCorrect = userAnswers.every((ans, i) => 
        ans.trim() === currentQ.blanks[i].trim() // 增加.trim()处理空格
      );
      
      // 更新正确计数
      let newCorrectCount = correctCount;
      if (isCorrect) {
        newCorrectCount += 1;
        wx.showToast({ title: '回答正确！', icon: 'success' });
      } else {
        wx.showToast({ title: '回答错误', icon: 'none' });
      }
      
      // 计算正确率
      const accuracy = Math.round((newCorrectCount / (this.data.currentQuestionIndex + 1)) * 100);
      
      this.setData({
        isAnswered: true, // 提交后一定为true
        isCorrect,        // 正确/错误状态
        correctCount: newCorrectCount,
        accuracy: accuracy // 更新正确率
      });
    } catch (error) {
      console.error('提交答案错误:', error);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },

  // 重新开始
  restartGame() {
    try {
      // 显示确认对话框
      wx.showModal({
        title: '重新开始',
        content: '确定要重新开始游戏吗？当前进度将丢失。',
        success: (res) => {
          if (res.confirm) {
            this.loadPoemsByDifficulty();
            wx.showToast({ title: '游戏已重置', icon: 'success' });
          }
        }
      });
    } catch (error) {
      console.error('重新开始错误:', error);
      wx.showToast({ title: '重置失败，请重试', icon: 'none' });
    }
  },

  // 页面卸载时清理资源
  onUnload() {
    // 可以在这里添加清理逻辑
  },

  // 页面隐藏时的处理
  onHide() {
    // 可以在这里添加暂停逻辑
  },

  // 页面显示时的处理
  onShow() {
    // 确保页面显示时，所有状态都被正确初始化
    if (this.data.currentDifficultyPoems && this.data.currentDifficultyPoems.length > 0) {
      // 检查当前题目索引是否有效
      const currentQ = this.data.currentDifficultyPoems[this.data.currentQuestionIndex];
      if (currentQ) {
        // 确保userAnswers数组长度正确
        const tempAnswers = [...this.data.userAnswers];
        while (tempAnswers.length < currentQ.blanks.length) {
          tempAnswers.push('');
        }
        while (tempAnswers.length > currentQ.blanks.length) {
          tempAnswers.pop();
        }
        
        // 重新计算hasEmptyAnswer状态
        const hasEmpty = tempAnswers.some(ans => !ans || ans.trim() === '');
        
        // 更新状态
        this.setData({
          userAnswers: tempAnswers,
          hasEmptyAnswer: hasEmpty
        });
      }
    }
  }
});