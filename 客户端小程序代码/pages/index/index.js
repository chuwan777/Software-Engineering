// pages/index/index.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');
Page({
  data: {
    poemList: [],        // 诗词列表
    isLoading: false,    // 是否正在加载
    loadFailed: false,   // 是否加载失败
    hotPoem: {},         // 热门推荐
    isLogin: auth.isLoggedIn(), // 登录状态
    userStats: null,     // 用户统计数据，未登录时为null

    searchValue: '',     // 搜索值
    filteredPoems: [],   // 过滤后的诗词列表
    pageAnimation: null, // 页面入场动画
    searchAnimation: null, // 搜索框动画
    isSearchFocused: false, // 搜索框是否聚焦
    scrollTop: 0,        // 滚动位置
    showBackToTop: false // 是否显示返回顶部按钮
  },

  // 页面加载时执行
  onLoad() {
    // 初始化页面入场动画
    this.initPageAnimation();
    
    // 并行发起API请求，减少页面加载时间
    Promise.all([
      this.getPoemList(),
      this.getUserStats()
    ]).catch(error => {
      console.error('API请求失败:', error);
    });
    
    // 监听全局登录成功事件（适用于switchTab的情况）
    const app = getApp();
    if (app.globalData && app.globalData.eventBus) {
      app.globalData.eventBus.on('loginSuccess', () => {
        console.log('index.js - 监听到全局登录成功事件，刷新学习进度');
        this.getUserStats();
      });
      
      // 监听学习完成事件
      app.globalData.eventBus.on('learnComplete', () => {
        console.log('index.js - 监听到学习完成事件，刷新学习进度');
        this.getUserStats();
      });
    }
  },
  
  /**
   * 初始化页面入场动画
   */
  initPageAnimation() {
    const pageAnimation = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-out'
    });
    
    pageAnimation.opacity(0).translateY(20).step();
    pageAnimation.opacity(1).translateY(0).step({ duration: 600 });
    
    this.setData({
      pageAnimation: pageAnimation.export()
    });
  },
  
  // 页面显示时执行，用于刷新数据
  onShow() {
    // 检查登录状态
    this.setData({
      isLogin: auth.isLoggedIn()
    });
    
    // 重新获取用户统计数据
    this.getUserStats();
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
   * 搜索框聚焦时的动画处理
   */
  onSearchFocus() {
    const searchAnimation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out'
    });
    
    searchAnimation.scaleX(1.05).step();
    
    this.setData({
      searchAnimation: searchAnimation.export(),
      isSearchFocused: true
    });
  },
  
  /**
   * 搜索框失焦时的动画处理
   */
  onSearchBlur() {
    const searchAnimation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out'
    });
    
    searchAnimation.scaleX(1).step();
    
    this.setData({
      searchAnimation: searchAnimation.export(),
      isSearchFocused: false
    });
  },
  
  /**
   * 返回顶部
   */
  scrollToTop() {
    const scrollAnimation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease-out'
    });
    
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    });
  },

  // 获取诗词列表
  getPoemList(isRefresh = false) {
    if (!isRefresh) {
      this.setData({ isLoading: true, loadFailed: false });
    }
    
    // 直接使用本地数据文件
    const poemsData = require('../../data/poems.js');
    let allPoems = poemsData.data;
    
    // 按热度排序（模拟原API的sortBy: 'popularity'）
    allPoems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    
    // 取前10首，限制诗词精选加载数量
    const poemData = allPoems.slice(0, 10);
    
    // 保持原有的动画效果
    const animatedList = poemData.map((item, index) => {
      const animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease-out'
      });
      
      animation
        .translateY(30)
        .opacity(0)
        .step()
        .translateY(0)
        .opacity(1)
        .step({ delay: index * 50 });
        
      return {
        ...item,
        animation: animation.export(),
        showImage: false // 初始化图片为隐藏状态
      };
    });

    this.setData({ 
      poemList: animatedList,
      filteredPoems: animatedList,
      loadFailed: false,
      isLoading: false
    });
    
    // 更新热门推荐
    this.updateHotPoem(animatedList);
    
    // 无需图片懒加载，当前页面不显示图片
    
    wx.stopPullDownRefresh();
  },
  
  // 获取热门推荐（已合并到getPoemList中，不再单独请求）
  updateHotPoem(poemList) {
    if (Array.isArray(poemList) && poemList.length > 0) {
      this.setData({
        hotPoem: poemList[0] // 取第一首作为热门推荐
      });
    }
  },
  
  // 获取用户学习进度
  getUserStats() {
    // 只有登录用户才获取学习进度数据
    console.log('getUserStats - 开始获取用户统计数据');
    
    // 手动检查登录状态相关的存储数据
    const token = auth.getToken();
    const userInfo = auth.getUserInfo();
    const isLogin = auth.isLoggedIn();
    
    console.log('getUserStats - token:', token);
    console.log('getUserStats - userInfo:', userInfo);
    console.log('getUserStats - 当前登录状态:', isLogin);
    
    // 更新页面登录状态
    this.setData({
      isLogin: isLogin
    });
    
    if (isLogin) {
      console.log('getUserStats - 正在发送API请求...');
      
      // 使用API.profile.getProfile()方法
      API.profile.getProfile().then(res => {
        console.log('getUserStats - API请求成功，返回数据:', res);
        
        // 处理不同可能的响应格式
        let userData = null;
        
        // 格式1: 标准API封装格式 { success: true, data: {...} }
        if (res.success && res.data) {
          userData = res.data;
        } 
        // 格式2: 直接返回数据（可能的服务器实际返回格式）
        else if (res.data && res.data.learnedPoems !== undefined) {
          userData = res.data;
        }
        // 格式3: 响应本身就是数据对象
        else if (res.learnedPoems !== undefined) {
          userData = res;
        }
        
        if (userData) {
          console.log('getUserStats - 解析到用户统计数据:', userData);
          
          const stats = {
            learned: userData.learnedPoems || 0,
            streak: userData.streakDays || 0,
            mastery: `${userData.masteryRate || 0}%`,
            learnedPercent: Math.min((userData.learnedPoems || 0) * 10, 100), // 简单计算百分比
            masteryPercent: userData.masteryRate || 0
          };
          
          console.log('getUserStats - 格式化后的统计数据:', stats);
          
          this.setData({
            userStats: stats
          });
          
          console.log('getUserStats - 页面数据已更新:', this.data);
        } else {
          console.log('getUserStats - 响应数据格式不符合预期:', res);
        }
      }).catch(error => {
        console.error('获取用户统计数据失败:', error);
        // 认证失败时清除登录状态
        if (error.message === '认证失败') {
          this.setData({
            isLogin: false,
            userStats: null
          });
        }
      });
    } else {
      console.log('getUserStats - 用户未登录，不获取统计数据');
      // 未登录时确保userStats为null
      this.setData({
        userStats: null
      });
    }
  },
  
  // 跳转到诗词详情页
  goToPoemDetail(e) {
    const poemId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/poem-detail/poem-detail?id=${poemId}`
    });
  },
  
  // 处理搜索输入
  handleSearchInput(e) {
    const value = e.detail.value;
    this.setData({ searchValue: value });
    
    if (value) {
      // 直接在完整诗词数据上搜索，不依赖于已加载的poemList
      const poemsData = require('../../data/poems.js');
      const allPoems = poemsData.data;
      
      const filtered = allPoems.filter(poem => 
        poem.title.includes(value) || 
        poem.author.includes(value) || 
        poem.content.includes(value) ||
        poem.dynasty.includes(value) ||
        poem.category.includes(value)
      );
      this.setData({ filteredPoems: filtered });
    } else {
      this.setData({ filteredPoems: this.data.poemList });
    }
  },
  
  // 清空搜索
  clearSearch() {
    this.setData({
      searchValue: '',
      filteredPoems: this.data.poemList
    });
  },
  
  // 跳转到分类页面
  goToCategory(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/category/category?type=${type}`
    });
  },
  
  // 处理登录
  handleLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
      // 登录成功后刷新学习进度
      success: (res) => {
        // 监听页面返回事件
        res.eventChannel.on('loginSuccess', (data) => {
          console.log('handleLogin - 登录成功，刷新学习进度');
          // 重新获取用户统计数据
          this.getUserStats();
        });
      }
    });
  },
  


  // 下拉刷新
  onPullDownRefresh() {
    this.getPoemList(true);
    this.getUserStats();
  },
  
  // 重试加载数据
  retryLoadData() {
    this.getPoemList();
  }
});
