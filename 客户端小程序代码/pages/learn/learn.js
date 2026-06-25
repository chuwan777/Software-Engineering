// pages/learn/learn.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');
const config = require('../../config');

Page({
  data: {
    poemList: [], // 保存古诗列表信息
    isLoading: false, // 加载状态
    loadFailed: false, // 是否加载失败
    pageAnimation: null, // 页面入场动画（暂时不使用）
    scrollTop: 0, // 滚动位置
    showBackToTop: false, // 是否显示返回顶部按钮
    // AI小助手相关
    showAiChat: false, // 控制AI聊天界面显示/隐藏
    messages: [], // 聊天消息列表
    userInput: '', // 用户输入内容
    isAiLoading: false, // AI回复加载状态
    lastMessageId: '' // 用于滚动到最新消息
  },

  // 分页相关配置
  listData: {
    page: 1,         // 默认请求第1页的数据
    pageSize: 10,    // 默认每页请求10条数据
    total: 0,        // 数据总数
  },

  /**
   * @description: 核心函数：获取古诗列表数据
   * @param {function} cb - 数据加载完成后的回调函数
   */
  getPoemList: function (cb) {
    if (this.data.isLoading) {
      cb && cb();
      return;
    }

    console.log('开始加载古诗数据...');
    this.setData({ isLoading: true, loadFailed: false });
    wx.showLoading({ title: '古诗加载中...' });

    // 确保 listData 存在
    if (!this.listData) {
      this.listData = {
        page: 1,
        pageSize: 10,
        total: 0
      };
      console.log('listData 初始化完成：', this.listData);
    }

    // 从本地服务器获取分页数据
    wx.request({
      url: 'http://127.0.0.1:3000/data',
      data: {
        page: this.listData.page,
        pageSize: this.listData.pageSize
      },
      method: 'GET',
      success: (res) => {
        console.log('获取到的古诗数据：', res.data);
        
        // 获取分页后的数据 - 服务器直接返回数据数组
        let pagePoems = res.data;
        
        console.log('分页后的数据：', pagePoems.length, '首');
        
        // 从响应头获取总记录数
        let totalCount = parseInt(res.header['X-Total-Count'] || res.header['x-total-count']);
        
        // 更新总记录数
        this.listData.total = totalCount;
        console.log('总记录数：', this.listData.total);
        
        // 处理古诗数据，确保兼容原有结构
        const processedPoems = pagePoems.map((poem, index) => {
          console.log('处理第', index, '首诗：', poem.title);
          
          // 转换数据结构，确保与原有代码兼容
          return {
            ...poem,
            // 添加 dynasty 字段，默认为空
            dynasty: '',
            // 添加 category 字段，默认为空
            category: ''
          };
        });
        
        console.log('处理完成的古诗数据：', processedPoems.length, '首');
        
        this.setData({
          poemList: [...this.data.poemList, ...processedPoems],
          loadFailed: false
        }, () => {
          console.log('poemList 更新完成：', this.data.poemList.length, '首');
        });
      },
      fail: (error) => {
        console.error('请求服务器失败：', error);
        this.setData({ loadFailed: true });
        wx.showToast({ title: '加载失败，请稍后重试', icon: 'error' });
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        cb && cb();
        console.log('数据加载完成，isLoading：', this.data.isLoading, 'loadFailed：', this.data.loadFailed, 'poemList 长度：', this.data.poemList.length);
      }
    });
  },

  /**
   * @description: 页面加载时触发
   */
  onLoad() {
    // 检查登录状态（暂时注释掉，方便调试）
    // if (!auth.isLoggedIn()) {
    //   wx.redirectTo({ url: '/pages/login/login' });
    //   return;
    // }
    
    // 初始化页面入场动画
    this.initPageAnimation();
    
    // 从本地存储加载聊天历史记录
    this.loadChatHistory();
    
    this.getPoemList();
  },
  
  /**
   * 初始化页面入场动画（暂时注释掉，方便调试）
   */
  initPageAnimation() {
    // 暂时不使用页面入场动画
    // const pageAnimation = wx.createAnimation({
    //   duration: 800,
    //   timingFunction: 'ease-out'
    // });
    // 
    // pageAnimation.opacity(0).translateY(20).step();
    // pageAnimation.opacity(1).translateY(0).step({ duration: 600 });
    // 
    // this.setData({
    //   pageAnimation: pageAnimation.export()
    // });
  },
  
  /**
   * 页面滚动事件处理
   */
  onPageScroll(e) {
    // 控制返回顶部按钮的显示/隐藏
    this.setData({
      scrollTop: e.scrollTop,
      showBackToTop: e.scrollTop > 500
    });
  },
  
  /**
   * 返回顶部
   */
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    });
  },

  /**
   * @description: 页面上拉触底时触发
   */
  onReachBottom: function () {
    if (this.listData.page * this.listData.pageSize >= this.listData.total) {
      wx.showToast({ title: '已加载全部古诗', icon: 'none', duration: 1500 });
      return;
    }
    this.listData.page++;
    this.getPoemList();
  },

  /**
   * @description: 页面下拉刷新时触发
   */
  onPullDownRefresh: function () {
    this.listData.page = 1;
    this.listData.total = 0;
    this.setData({ poemList: [], loadFailed: false }, () => {
      this.getPoemList(() => {
        wx.stopPullDownRefresh();
      });
    });
  },
  
  /**
   * @description: 新增功能：点击诗歌项，跳转到详情页
   * @param {Object} e - 事件对象
   */
  goToPoemDetail(e) {
    // 1. 从事件对象中获取当前点击项的诗歌 ID 和索引
    const { id, index } = e.currentTarget.dataset;
    
    // 2. 获取完整的诗歌数据
    const poemData = this.data.poemList[index];

    // 3. 跳转到详情页，并通过 URL 参数传递 ID 和图片信息
    wx.navigateTo({
      url: `/pages/poem-detail/poem-detail?id=${id}&from=learn&imageUrl=${encodeURIComponent(poemData.imageUrl || '')}`,
      animationType: 'slide-in-right',
      animationDuration: 300
    });
  },
  
  /**
   * @description: 重试加载数据
   */
  retryLoadData() {
    this.listData.page = 1;
    this.listData.total = 0;
    this.setData({ poemList: [], loadFailed: false }, () => {
      this.getPoemList();
    });
  },

  /**
   * @description: 切换AI聊天界面显示/隐藏
   */
  toggleAiChat() {
    this.setData({
      showAiChat: !this.data.showAiChat,
      userInput: '' // 清空输入框
    });
  },

  /**
   * @description: 处理用户输入变化
   * @param {Object} e - 事件对象
   */
  onInputChange(e) {
    this.setData({
      userInput: e.detail.value
    });
  },

  /**
   * @description: 格式化时间
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /**
   * @description: 加载聊天历史记录
   */
  loadChatHistory() {
    try {
      const chatHistory = wx.getStorageSync('poemChatHistory');
      if (chatHistory) {
        // 确保每条消息都有formattedTime字段
        const messagesWithFormattedTime = chatHistory.map(msg => {
          if (!msg.formattedTime && msg.timestamp) {
            return {
              ...msg,
              formattedTime: this.formatTime(new Date(msg.timestamp))
            };
          }
          return msg;
        });
        this.setData({
          messages: messagesWithFormattedTime
        });
      }
    } catch (error) {
      console.error('加载聊天历史记录失败:', error);
    }
  },

  /**
   * @description: 保存聊天历史记录
   */
  saveChatHistory() {
    try {
      wx.setStorageSync('poemChatHistory', this.data.messages);
    } catch (error) {
      console.error('保存聊天历史记录失败:', error);
    }
  },

  /**
   * @description: 清除聊天历史记录
   */
  clearChatHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清除所有聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            this.setData({
              messages: []
            });
            wx.removeStorageSync('poemChatHistory');
            wx.showToast({
              title: '已清除',
              icon: 'success'
            });
          } catch (error) {
            console.error('清除聊天历史记录失败:', error);
            wx.showToast({
              title: '清除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  /**
   * @description: 发送消息
   */
  sendMessage() {
    const userMessage = this.data.userInput.trim();
    if (!userMessage || this.data.isAiLoading) return;

    // 添加用户消息
    const now = new Date();
    const newMessages = [...this.data.messages, {
      id: this.generateMessageId(),
      type: 'user',
      content: userMessage,
      timestamp: now.toISOString(),
      formattedTime: this.formatTime(now)
    }];

    this.setData({
      messages: newMessages,
      userInput: '',
      isAiLoading: true,
      lastMessageId: newMessages[newMessages.length - 1].id
    });

    // 保存聊天历史记录
    this.saveChatHistory();

    // 模拟AI回复（实际项目中这里应该调用AI API）
    setTimeout(() => {
      const aiReply = this.generateAiReply(userMessage);
      const aiNow = new Date();
      const updatedMessages = [...newMessages, {
        id: this.generateMessageId(),
        type: 'assistant',
        content: aiReply,
        timestamp: aiNow.toISOString(),
        formattedTime: this.formatTime(aiNow)
      }];

      this.setData({
        messages: updatedMessages,
        isAiLoading: false,
        lastMessageId: updatedMessages[updatedMessages.length - 1].id
      });

      // 保存聊天历史记录
      this.saveChatHistory();
    }, 1000);
  },

  /**
   * @description: 生成唯一消息ID
   * @returns {string} 消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * @description: 生成AI回复（模拟）
   * @param {string} userInput - 用户输入
   * @returns {string} AI回复
   */
  generateAiReply(userInput) {
    const lowerInput = userInput.toLowerCase();
    const replies = [
      '你可以问我关于古诗的问题，比如"介绍一下李白"或者"什么是五言绝句"。',
      '这首诗的意境很美，它表达了诗人对大自然的热爱之情。',
      '李白是唐代著名的浪漫主义诗人，被后人称为"诗仙"。',
      '五言绝句是中国古典诗歌的一种形式，每首四句，每句五个字。',
      '杜甫是唐代伟大的现实主义诗人，他的诗被称为"诗史"。',
      '古诗是中国传统文化的瑰宝，蕴含着丰富的历史和文化内涵。',
      '你喜欢唐代的诗还是宋代的词呢？',
      '学习古诗可以帮助我们更好地了解中国古代文化和历史。',
      '这首诗使用了比喻的修辞手法，将...比作...，生动形象。',
      '古诗的韵律和节奏非常优美，多读多背有助于培养语感。'
    ];

    // 根据关键词生成特定回复
    if (lowerInput.includes('李白') || lowerInput.includes('诗仙')) {
      // 查找当前加载的诗歌中的李白作品
      const liBaiPoems = this.data.poemList.filter(poem => poem.author && poem.author.includes('李白'));
      if (liBaiPoems.length > 0) {
        const poemTitles = liBaiPoems.map(poem => poem.title).slice(0, 3).join('、');
        return `李白（701年-762年），字太白，号青莲居士，是唐代伟大的浪漫主义诗人，被后人誉为"诗仙"。当前页面中有他的作品：《${poemTitles}》等。你可以点击查看详情了解更多。`;
      } else {
        return '李白（701年-762年），字太白，号青莲居士，是唐代伟大的浪漫主义诗人，被后人誉为"诗仙"。他的诗歌风格豪放飘逸、意境奇妙，代表作有《将进酒》《望庐山瀑布》《蜀道难》等。';
      }
    } else if (lowerInput.includes('杜甫') || lowerInput.includes('诗圣')) {
      // 查找当前加载的诗歌中的杜甫作品
      const duFuPoems = this.data.poemList.filter(poem => poem.author && poem.author.includes('杜甫'));
      if (duFuPoems.length > 0) {
        const poemTitles = duFuPoems.map(poem => poem.title).slice(0, 3).join('、');
        return `杜甫（712年-770年），字子美，自号少陵野老，是唐代伟大的现实主义诗人，与李白合称"李杜"。当前页面中有他的作品：《${poemTitles}》等。你可以点击查看详情了解更多。`;
      } else {
        return '杜甫（712年-770年），字子美，自号少陵野老，是唐代伟大的现实主义诗人，与李白合称"李杜"。他的诗反映了唐代由盛转衰的历史过程，被称为"诗史"，代表作有《登高》《春望》《三吏》《三别》等。';
      }
    } else if (lowerInput.includes('唐诗') || lowerInput.includes('唐代')) {
      // 查找当前加载的诗歌中的唐诗
      const tangPoems = this.data.poemList.filter(poem => poem.dynasty && poem.dynasty.includes('唐'));
      if (tangPoems.length > 0) {
        const poemTitles = tangPoems.map(poem => poem.title).slice(0, 3).join('、');
        return `唐代是中国诗歌发展的黄金时代，涌现出了大量杰出的诗人和作品。当前页面中有${tangPoems.length}首唐诗，包括：《${poemTitles}》等。`;
      } else {
        return '唐代是中国诗歌发展的黄金时代，涌现出了大量杰出的诗人和作品。唐诗题材广泛，风格多样，主要分为古体诗和近体诗两大类，代表诗人有李白、杜甫、王维、白居易等。';
      }
    } else if (lowerInput.includes('宋词') || lowerInput.includes('宋代')) {
      // 查找当前加载的诗歌中的宋词
      const songPoems = this.data.poemList.filter(poem => poem.dynasty && poem.dynasty.includes('宋'));
      if (songPoems.length > 0) {
        const poemTitles = songPoems.map(poem => poem.title).slice(0, 3).join('、');
        return `宋词是宋代文学的代表形式，分为婉约派和豪放派两大流派。当前页面中有${songPoems.length}首宋词，包括：《${poemTitles}》等。`;
      } else {
        return '宋词是宋代文学的代表形式，分为婉约派和豪放派两大流派。婉约派以柳永、李清照为代表，风格委婉含蓄；豪放派以苏轼、辛弃疾为代表，风格豪放奔放。宋词在形式上更灵活，句子长短不一，更适合表达复杂的情感。';
      }
    } else if (lowerInput.includes('绝句') || lowerInput.includes('律诗')) {
      return '绝句和律诗都是唐代形成的近体诗形式。绝句每首四句，分为五言绝句和七言绝句；律诗每首八句，分为五言律诗和七言律诗。它们都有严格的平仄、押韵和对仗要求。';
    } else if (lowerInput.includes('意思') || lowerInput.includes('解释') || lowerInput.includes('赏析')) {
      // 尝试从用户输入中提取诗歌标题
      const titleRegex = /《([^》]+)》/g;
      const match = titleRegex.exec(userInput);
      if (match) {
        const title = match[1];
        const poem = this.data.poemList.find(poem => poem.title.includes(title));
        if (poem) {
          return `《${poem.title}》是${poem.dynasty}代诗人${poem.author}的作品。\n\n原文：${poem.content}\n\n这首诗表达了诗人对生活的感悟和对自然的赞美之情。（实际应用中可以加入更详细的赏析内容）`;
        } else {
          return `抱歉，我没有找到《${title}》的详细信息。你可以尝试查看页面上的其他诗歌。`;
        }
      } else {
        return '这首诗的意思是...（由于没有具体诗歌内容，我无法提供准确的解释。你可以告诉我具体的诗歌名称，我会为你详细解析。）';
      }
    } else if (lowerInput.includes('推荐') || lowerInput.includes('介绍')) {
      // 推荐当前页面的诗歌
      if (this.data.poemList.length > 0) {
        const randomPoem = this.data.poemList[Math.floor(Math.random() * this.data.poemList.length)];
        return `我为你推荐一首诗：《${randomPoem.title}》\n\n作者：${randomPoem.dynasty}·${randomPoem.author}\n\n内容：${randomPoem.content.slice(0, 50)}...\n\n你可以点击查看详情了解完整内容。`;
      } else {
        return '当前页面没有加载诗歌数据，我无法为你推荐。请稍后再试。';
      }
    }

    // 随机返回一个通用回复
    return replies[Math.floor(Math.random() * replies.length)];
  }
});