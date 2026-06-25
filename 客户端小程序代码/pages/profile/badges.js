// pages/profile/badges.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');
const Cache = require('../../utils/cache.js');

Page({
  data: {
    badges: [],
    isLoading: true,
    showBadgeDetail: false,
    currentBadge: null
  },

  onLoad: function() {
    wx.setNavigationBarTitle({ title: '我的徽章' });
    this.loadBadges();
  },

  /**
   * 加载徽章列表
   */
  loadBadges: function() {
    this.setData({ isLoading: true });
    
    const cacheKey = 'badges_list';
    const cachedData = Cache.get(cacheKey);
    
    if (cachedData) {
      // 即使从缓存获取，也要确保只显示已获得的徽章
      const earnedBadgesFromCache = cachedData.filter(badge => badge.earned);
      
      this.setData({
        badges: earnedBadgesFromCache,
        isLoading: false
      });
      return;
    }

    API.user.getBadges().then(res => {
      if (res.success) {
        // 只保留已获得的徽章
        const earnedBadges = res.data.filter(badge => badge.earned);
        
        // 为每个已获得的徽章添加详情和获取条件
        const badgesWithDetails = earnedBadges.map(badge => ({
          ...badge,
          details: this.getBadgeDetails(badge.name),
          conditions: this.getBadgeConditions(badge.name)
        }));
        
        this.setData({
          badges: badgesWithDetails,
          isLoading: false
        });
        
        // 缓存数据
        Cache.set(cacheKey, badgesWithDetails, 60 * 60 * 1000);
      } else {
        wx.showToast({
          title: '获取徽章列表失败',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      }
    }).catch(error => {
      console.error('加载徽章失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    });
  },

  /**
   * 获取徽章详情
   */
  getBadgeDetails: function(badgeName) {
    const badgeDetails = {
      '启蒙学者': '恭喜你完成了第一首古诗的学习！',
      '诗词爱好者': '学习进度达到33%，继续保持！',
      '诗词达人': '学习进度达到66%，成为诗词达人！',
      '诗词大师': '学习进度达到100%，成为诗词大师！',
      '坚持学习': '连续学习3天，坚持就是胜利！'
    };
    return badgeDetails[badgeName] || '这是一个特殊的徽章！';
  },

  /**
   * 获取徽章获取条件
   */
  getBadgeConditions: function(badgeName) {
    const badgeConditions = {
      '启蒙学者': '完成第一首古诗学习',
      '诗词爱好者': '学习进度达到33%',
      '诗词达人': '学习进度达到66%',
      '诗词大师': '学习进度达到100%',
      '坚持学习': '连续学习3天'
    };
    return badgeConditions[badgeName] || '获取条件未知';
  },

  /**
   * 显示徽章详情
   */
  showBadgeDetail: function(e) {
    const index = e.currentTarget.dataset.index;
    const badge = this.data.badges[index];
    
    this.setData({
      showBadgeModal: true,
      currentBadge: badge
    });
  },

  /**
   * 关闭徽章详情模态框
   */
  closeBadgeModal: function() {
    this.setData({
      showBadgeModal: false,
      currentBadge: null
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    // 下拉刷新时清除缓存，确保获取最新数据
    const cacheKey = 'badges_list';
    Cache.remove(cacheKey);
    this.loadBadges();
    wx.stopPullDownRefresh();
  }
});