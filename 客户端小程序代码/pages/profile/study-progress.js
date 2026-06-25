// pages/profile/study-progress.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');
const Cache = require('../../utils/cache.js');

Page({
  data: {
    studyProgress: {},
    learningHistory: [],
    isLoading: true
  },

  onLoad: function() {
    wx.setNavigationBarTitle({ title: '学习进度' });
    this.loadStudyProgress();
    this.loadLearningHistory();
  },

  /**
   * 加载学习进度数据
   */
  loadStudyProgress: function() {
    this.setData({ isLoading: true });
    
    const cacheKey = 'study_progress_detail';
    const cachedData = Cache.get(cacheKey);
    
    if (cachedData) {
      this.setData({
        studyProgress: cachedData,
        isLoading: false
      });
      return;
    }

    API.profile.getProfile().then(res => {
      if (res.success) {
        this.setData({
          studyProgress: res.data || {}
        });
        
        // 缓存数据
        Cache.set(cacheKey, res.data || {}, 60 * 60 * 1000);
      } else {
        wx.showToast({
          title: '获取学习进度失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('加载学习进度失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },

  /**
   * 加载学习历史记录
   */
  loadLearningHistory: function() {
    const cacheKey = 'learning_history';
    const cachedData = Cache.get(cacheKey);
    
    if (cachedData) {
      this.setData({
        learningHistory: cachedData
      });
      return;
    }

    API.poems.getHistory().then(res => {
      if (res.success) {
        this.setData({
          learningHistory: res.data || []
        });
        
        // 缓存数据
        Cache.set(cacheKey, res.data || [], 60 * 60 * 1000);
      }
    }).catch(error => {
      console.error('加载学习历史失败:', error);
    });
  },

  /**
   * 跳转到诗歌详情页
   */
  goToPoemDetail: function(e) {
    const poemId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/poem-detail/poem-detail?id=${poemId}`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.loadStudyProgress();
    this.loadLearningHistory();
    wx.stopPullDownRefresh();
  }
});