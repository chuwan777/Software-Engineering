const app = getApp()
// 导入通用数据文件
const { imageMatchingData, gameConfig } = require('../data/common-data.js')

Page({
  data: {
    // 游戏配置
    gameConfig: gameConfig.imageMatching,  // 从通用数据获取配置
    
    // 游戏数据
    poems: [],                // 诗句列表
    images: [],               // 意象列表
    selected: [],             // 已选择的项
    selectedPoemIndex: -1,    // 当前选中的诗句索引
    selectedImageIndex: -1,   // 当前选中的意象索引
    pairs: [],                // 已配对的项
    score: 0,                 // 总得分
    round: 1,                 // 当前回合
    correctAnswers: 0,        // 正确答案数
    totalAttempts: 0,         // 总尝试次数
    isLoading: true,          // 加载状态
    isSubmitted: false,       // 是否提交
    startTime: 0,             // 回合开始时间
    usedTime: 0,              // 回合用时
    timer: null,              // 计时器
    // 错误状态
    hasError: false,
    errorMsg: ''
  },

  onLoad() {
    this.loadGameData()
  },

  onUnload() {
    // 页面卸载时清除计时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  loadGameData() {
    this.setData({ isLoading: true, hasError: false, errorMsg: '' });
    
    // 清除之前的计时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    
    try {
      // 验证数据是否存在
      if (!imageMatchingData || !Array.isArray(imageMatchingData) || imageMatchingData.length === 0) {
        throw new Error('题目数据加载失败，请重试');
      }
      
      // 模拟网络请求获取题目
      setTimeout(() => {
        try {
          // 随机选择一个题目
          const randomIndex = Math.floor(Math.random() * imageMatchingData.length);
          const selectedQuestion = imageMatchingData[randomIndex];
          
          if (!selectedQuestion || !selectedQuestion.imagePairs || !Array.isArray(selectedQuestion.imagePairs)) {
            throw new Error('题目格式错误');
          }
          
          // 提取诗句和意象对，添加类型检查
          let poemPairs = [];
          let meaningPairs = [];
          
          if (Array.isArray(selectedQuestion.imagePairs)) {
            poemPairs = selectedQuestion.imagePairs.filter(pair => pair && pair.type === "poem");
            meaningPairs = selectedQuestion.imagePairs.filter(pair => pair && pair.type === "meaning");
          } else {
            throw new Error('imagePairs不是有效的数组');
          }
          
          // 确保过滤结果仍然是数组
          if (!Array.isArray(poemPairs) || !Array.isArray(meaningPairs)) {
            throw new Error('过滤结果不是有效的数组');
          }
          
          if (poemPairs.length === 0 || meaningPairs.length === 0 || poemPairs.length !== meaningPairs.length) {
            throw new Error('题目数据不完整');
          }
          
          // 随机打乱，确保传入的是数组
          const shuffledPoems = this.shuffleArray(poemPairs);
          const shuffledImages = this.shuffleArray(meaningPairs);
          
          this.setData({
            poems: shuffledPoems,
            images: shuffledImages,
            selected: [],
            selectedPoemIndex: -1,
            selectedImageIndex: -1,
            pairs: [],
            currentQuestion: selectedQuestion,
            isLoading: false,
            isSubmitted: false,
            startTime: Date.now(),
            usedTime: 0
          });
          
          // 开始计时
          this.startTimer();
        } catch (error) {
          console.error('加载题目错误:', error);
          this.setData({
            isLoading: false,
            hasError: true,
            errorMsg: error.message || '题目加载失败'
          });
        }
      }, 1000);
    } catch (error) {
      console.error('加载游戏数据错误:', error);
      this.setData({
        isLoading: false,
        hasError: true,
        errorMsg: '游戏数据加载失败，请重试'
      });
    }
  },

  // 生成不重复的随机索引
  getShuffledIndices(max) {
    // 使用更兼容的方式创建数组
    const indices = [];
    for (let i = 0; i < max; i++) {
      indices.push(i);
    }
    return this.shuffleArray(indices);
  },

  // 数组随机排序
  shuffleArray(array) {
    // 添加类型检查
    if (!Array.isArray(array)) {
      console.error('shuffleArray: 参数必须是数组', array);
      return [];
    }
    
    // 使用Array.from或slice()复制数组，提高兼容性
    const newArray = Array.isArray(array) ? array.slice() : [];
    
    // 使用传统的临时变量交换方式，提高兼容性
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newArray[i];
      newArray[i] = newArray[j];
      newArray[j] = temp;
    }
    
    return newArray;
  },

  // 开始计时
  startTimer() {
    let usedTime = 0
    const timer = setInterval(() => {
      usedTime++
      this.setData({ usedTime })
    }, 1000)
    
    this.setData({ timer })
  },

  selectItem(e) {
    try {
      const { type, index } = e.currentTarget.dataset
      const { selected, poems, images } = this.data
      
      // 验证选择的类型和索引是否有效
      if (type !== 'poem' && type !== 'meaning') {
        throw new Error('无效的选择类型');
      }
      
      if (type === 'poem' && (index < 0 || index >= poems.length)) {
        throw new Error('诗句索引无效');
      }
      
      if (type === 'meaning' && (index < 0 || index >= images.length)) {
        throw new Error('意象索引无效');
      }
      
      let newSelectedPoemIndex = this.data.selectedPoemIndex
      let newSelectedImageIndex = this.data.selectedImageIndex
      
      if (selected.length === 0) {
        selected.push({ type, index })
        if (type === 'poem') {
          newSelectedPoemIndex = index
          newSelectedImageIndex = -1
        } else {
          newSelectedImageIndex = index
          newSelectedPoemIndex = -1
        }
      } else if (selected.length === 1 && selected[0].type !== type) {
        selected.push({ type, index })
        if (type === 'poem') {
          newSelectedPoemIndex = index
        } else {
          newSelectedImageIndex = index
        }
        this.matchPair(selected)
        // 配对后重置选中状态
        newSelectedPoemIndex = -1
        newSelectedImageIndex = -1
      } else {
        selected.length = 0
        selected.push({ type, index })
        if (type === 'poem') {
          newSelectedPoemIndex = index
          newSelectedImageIndex = -1
        } else {
          newSelectedImageIndex = index
          newSelectedPoemIndex = -1
        }
      }
      
      this.setData({ 
        selected, 
        selectedPoemIndex: newSelectedPoemIndex,
        selectedImageIndex: newSelectedImageIndex
      })
    } catch (error) {
      console.error('选择项错误:', error);
      this.setData({ 
        selected: [], 
        selectedPoemIndex: -1,
        selectedImageIndex: -1
      });
      wx.showToast({ title: '选择失败，请重试', icon: 'none' });
    }
  },

  matchPair(selected) {
    try {
      const { poems, images, pairs, score, currentQuestion } = this.data
      
      if (selected.length !== 2) {
        throw new Error('选择项数量不正确');
      }
      
      const [poemSelect, imageSelect] = selected
      
      // 验证选择的数据是否有效
      if (!poems[poemSelect.index] || !images[imageSelect.index]) {
        throw new Error('选择的数据无效');
      }
      
      const poem = poems[poemSelect.index]
      const image = images[imageSelect.index]
      
      // 检查配对是否正确
      const isCorrect = poem.content === image.matching
      
      // 计算得分
      let newScore = score
      if (isCorrect) {
        newScore += this.data.gameConfig.baseScore
        wx.showToast({ title: '配对正确！', icon: 'success' });
      } else {
        wx.showToast({ title: '配对错误', icon: 'none' });
      }
      
      pairs.push({
        poem: poem.content,
        author: currentQuestion.author,
        title: currentQuestion.title,
        image: image.content,
        description: image.matching,
        isCorrect
      })
      
      this.setData({ 
        pairs, 
        selected: [], 
        selectedPoemIndex: -1,
        selectedImageIndex: -1,
        score: newScore,
        totalAttempts: this.data.totalAttempts + 1,
        correctAnswers: this.data.correctAnswers + (isCorrect ? 1 : 0)
      })
      
      // 如果所有配对完成，显示结果
      if (pairs.length === this.data.poems.length) {
        this.submitAnswer()
      }
    } catch (error) {
      console.error('配对错误:', error);
      this.setData({ 
        selected: [], 
        selectedPoemIndex: -1,
        selectedImageIndex: -1
      });
      wx.showToast({ title: '配对失败，请重试', icon: 'none' });
    }
  },

  submitAnswer() {
    try {
      // 停止计时
      if (this.data.timer) {
        clearInterval(this.data.timer)
        this.setData({ timer: null })
      }
      
      const { pairs, score, usedTime } = this.data
      
      if (!Array.isArray(pairs) || pairs.length === 0) {
        throw new Error('配对数据无效');
      }
      
      const correctPairs = pairs.filter(pair => pair.isCorrect)
      const isAllCorrect = correctPairs.length === pairs.length
      
      // 根据用时和正确率计算额外奖励分数
      const timeBonus = Math.max(0, this.data.gameConfig.timeLimit - usedTime) * this.data.gameConfig.timeBonus
      const accuracyBonus = isAllCorrect ? this.data.gameConfig.accuracyBonus : 0
      const finalScore = score + timeBonus + accuracyBonus
      
      this.setData({
        result: {
          isAllCorrect,
          correctCount: correctPairs.length,
          totalCount: pairs.length,
          score: finalScore,
          usedTime
        },
        isSubmitted: true
      })
      
      // 显示完成提示
      if (isAllCorrect) {
        wx.showToast({ title: '全部配对正确！', icon: 'success' });
      } else {
        wx.showToast({ title: '配对完成', icon: 'none' });
      }
    } catch (error) {
      console.error('提交答案错误:', error);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },

  nextRound() {
    try {
      const { round, gameConfig } = this.data
      
      if (gameConfig.maxRounds < round) {
        throw new Error('无效的回合数');
      }
      
      const nextRound = round + 1
      
      if (nextRound <= gameConfig.maxRounds) {
        this.setData({
          selected: [],
          pairs: [],
          result: null,
          round: nextRound
        })
        
        wx.showToast({ title: `第${nextRound}回合开始`, icon: 'none' });
        this.loadGameData()
      } else {
        wx.showModal({
          title: '游戏完成',
          content: '恭喜完成所有回合！',
          showCancel: false,
          success: () => {
            this.restartGame();
          }
        });
      }
    } catch (error) {
      console.error('下回合错误:', error);
      wx.showToast({ title: '切换回合失败', icon: 'none' });
    }
  },

  restartGame() {
    try {
      // 显示确认对话框
      wx.showModal({
        title: '重新开始',
        content: '确定要重新开始游戏吗？当前进度将丢失。',
        success: (res) => {
          if (res.confirm) {
            // 停止计时
            if (this.data.timer) {
              clearInterval(this.data.timer)
              this.setData({ timer: null })
            }
            
            this.setData({
              selected: [],
              selectedPoemIndex: -1,
              selectedImageIndex: -1,
              pairs: [],
              result: null,
              score: 0,
              usedTime: 0,
              round: 1,
              correctAnswers: 0,
              totalAttempts: 0
            })
            
            wx.showToast({ title: '游戏已重置', icon: 'success' });
            this.loadGameData()
          }
        }
      });
    } catch (error) {
      console.error('重新开始错误:', error);
      wx.showToast({ title: '重置失败，请重试', icon: 'none' });
    }
  },

  // 提示功能
  showHint() {
    try {
      const { poems, pairs, images, currentQuestion } = this.data
      
      if (!currentQuestion) {
        throw new Error('当前题目数据无效');
      }
      
      const unmatchedPoems = poems.filter((_, index) => 
        !pairs.some(pair => pair.poem === poems[index].content)
      )
      
      if (unmatchedPoems.length > 0) {
        const randomPoem = unmatchedPoems[Math.floor(Math.random() * unmatchedPoems.length)]
        // 找到正确的意象配对
        const correctImage = images.find(img => img.matching === randomPoem.content)
        
        if (correctImage) {
          wx.showModal({
            title: '提示',
            content: `${randomPoem.content} (${currentQuestion.author}《${currentQuestion.title}》) 与 "${correctImage.content}" 意象相关`,
            showCancel: false
          })
        } else {
          wx.showModal({
            title: '提示',
            content: `${randomPoem.content} (${currentQuestion.author}《${currentQuestion.title}》)`,
            showCancel: false
          })
        }
      } else {
        wx.showToast({ title: '当前没有可提示的配对', icon: 'none' });
      }
    } catch (error) {
      console.error('提示功能错误:', error);
      wx.showToast({ title: '提示获取失败', icon: 'none' });
    }
  }
});