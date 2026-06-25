// 我的页面逻辑
const auth = require('../../utils/auth.js');
const config = require('../../config.js');
const Cache = require('../../utils/cache.js');
const ErrorHandler = require('../../utils/errorHandler.js');
const API = require('../../utils/api.js');

Page({
  data: {
    // 页面数据
    userInfo: null,
    isLogin: false,
    isLoading: true,
    showAvatar: false,
    showGoalModal: false,
    studyProgress: {
      learned: 0,
      total: 0,
      percentage: 0,
      streakDays: 0,
      poemsRecited: 0,
      dailyGoal: 1,
      goalCompleted: false,
      monthlyDays: 0,
      completionRate: 0
    },
    badges: {
      count: 0,
      list: []
    },
    collection: {
      count: 0
    },
    recordings: [],
    imageObserver: null,
    showBadgeModal: false,
    currentBadge: null
  },
  
  onLoad: function(options) {
    // 页面加载时检查登录状态并加载数据
    this.checkLoginStatus();
  },

  /**
   * 显示学习目标设置模态框
   */
  showGoalModal: function() {
    this.setData({
      showGoalModal: true
    });
  },

  /**
   * 关闭学习目标设置模态框
   */
  closeGoalModal: function() {
    this.setData({
      showGoalModal: false
    });
  },

  /**
   * 设置学习目标
   */
  setDailyGoal: function(e) {
    const goal = parseInt(e.detail.value.goal);
    
    if (goal < 1 || goal > 10) {
      wx.showToast({
        title: '目标应在1-10之间',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    // 保存学习目标
    API.user.setDailyGoal(goal).then(res => {
      if (res.success) {
        wx.showToast({
          title: '目标设置成功',
          icon: 'success'
        });
        
        // 更新本地数据
        const studyProgress = { ...this.data.studyProgress, dailyGoal: goal };
        this.setData({
          studyProgress: studyProgress,
          showGoalModal: false
        });
      } else {
        wx.showToast({
          title: res.message || '设置失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('设置学习目标失败:', error);
      wx.showToast({
        title: '设置失败，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },
  
  onShow: function() {
    // 页面显示时重新加载数据
    this.checkLoginStatus();
    this.loadUserStudyData(true);
  },
  
  onReady: function() {
    // 页面渲染完成后初始化图片懒加载
    this.initImageLazyLoad();
  },
  
  onUnload: function() {
    // 页面卸载时清理观察器
    if (this.data.imageObserver) {
      this.data.imageObserver.disconnect();
    }
  },
  
  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    this.setData({ isLoading: true });
    
    if (auth.isLoggedIn()) {
      const userInfo = auth.getUserInfo();
      this.setData({
        userInfo,
        isLogin: true
      });
      
      // 延迟设置showAvatar为true，实现图片懒加载
      setTimeout(() => {
        this.setData({ showAvatar: true });
      }, 100);
      
      // 加载用户学习数据
      this.loadUserStudyData();
    } else {
      this.setData({
        userInfo: {
          name: '未登录',
          level: ''
        },
        isLogin: false,
        isLoading: false,
        showAvatar: false, // 未登录时隐藏头像
        // 重置学习数据为初始状态
        studyProgress: {
          learned: 0,
          total: 0,
          percentage: 0
        },
        badges: {
          count: 0,
          list: []
        },
        collection: {
          count: 0
        },
        recordings: []
      });
    }
  },

  /**
   * 检查登录状态并按需登录
   * @returns {boolean} 是否已登录
   */
  requireLogin() {
    if (!auth.isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '此功能需要登录后才能使用，请先登录',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return false;
    }
    return true;
  },
  
  /**
   * 初始化图片懒加载
   */
  initImageLazyLoad() {
    // 使用 IntersectionObserver 实现图片懒加载
    const observer = wx.createIntersectionObserver(this, {
      thresholds: [0],
      initialRatio: 0,
      observeAll: false
    });
    
    observer.relativeTo('.container');
    
    observer.observe('.user-avatar', (res) => {
      if (res.intersectionRatio > 0) {
        // 当图片进入视口时显示图片
        this.setData({ showAvatar: true });
        // 停止观察
        observer.disconnect();
      }
    });
    
    this.setData({ imageObserver: observer });
  },

  /**
   * 加载用户学习数据
   * @param {boolean} forceRefresh 是否强制刷新数据，跳过缓存
   */
  loadUserStudyData(forceRefresh = false) {
    if (!this.requireLogin()) {
      return;
    }

    wx.showLoading({ title: '加载学习数据...' });

    const cacheKey = 'user_study_data';
    
    // 尝试从缓存获取数据（如果不是强制刷新）
    if (!forceRefresh) {
      const cachedData = Cache.get(cacheKey);
      if (cachedData && cachedData.badges && cachedData.badges.count !== undefined && cachedData.badges.list) {
        // 确保缓存数据格式正确
        this.setData({
          studyProgress: cachedData.studyProgress,
          badges: cachedData.badges,
          collection: cachedData.collection,
          recordings: cachedData.recordings
        });
        this.setData({ isLoading: false });
        wx.hideLoading();
        return;
      }
    }

    // 从服务器获取用户学习数据
    API.profile.getProfile().then(res => {
      if (res.success && res.data) {
        const userProfile = res.data;
        
        // 计算详细学习统计
        const studyProgress = {
          learned: userProfile.learnedPoems || 0,
          total: userProfile.totalPoems || 100,
          percentage: userProfile.masteryRate || 0,
          streakDays: userProfile.streakDays || 0,
          poemsRecited: userProfile.poemsRecited || 0,
          dailyGoal: userProfile.dailyGoal || 1,
          goalCompleted: (userProfile.learnedPoems || 0) % (userProfile.dailyGoal || 1) === 0 ? true : false,
          // 计算本月学习天数
          monthlyDays: Math.floor((Date.now() - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()) / (1000 * 60 * 60 * 24)) + 1,
          // 计算完成率
          completionRate: (userProfile.dailyGoal || 1) > 0 ? Math.min(Math.floor(((userProfile.learnedPoems || 0) / (userProfile.dailyGoal || 1)) * 100), 100) : 0
        };
        
        // 为每个已获得的徽章添加详情和获取条件
        const badgesWithDetails = Array.isArray(userProfile.badges) ? userProfile.badges.map(badge => ({
          ...badge,
          details: this.getBadgeDetails(badge.name),
          conditions: this.getBadgeConditions(badge.name)
        })) : [];
        
        // 设置其他数据
        const badges = {
          count: badgesWithDetails.length,
          list: badgesWithDetails
        };
        
        const collection = {
          count: userProfile.collectionCount || 0
        };
        
        // 获取用户录制作品
        const recordings = Array.isArray(userProfile.recordings) ? userProfile.recordings : [];

        this.setData({
          studyProgress,
          badges,
          collection,
          recordings,
          showGoalModal: false
        });
        
        // 缓存用户学习数据，过期时间30分钟
        Cache.set(cacheKey, {
          studyProgress,
          badges,
          collection,
          recordings
        }, 30 * 60 * 1000);
      } else {
        wx.showToast({
          title: '获取学习数据失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('获取学习数据失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ isLoading: false });
      wx.hideLoading();
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    // 清除用户学习数据缓存
    const cacheKey = 'user_study_data';
    Cache.remove(cacheKey);
    
    // 重新加载用户学习数据
    this.loadUserStudyData();
    
    // 停止下拉刷新动画
    wx.stopPullDownRefresh();
  },
  
  // 导航到学习进度页面
  navigateToStudyProgress: function() {
    if (!this.requireLogin()) return;
    wx.navigateTo({
      url: '/pages/profile/study-progress'
    })
  },
  
  // 导航到徽章页面
  navigateToBadges: function() {
    if (!this.requireLogin()) return;
    wx.navigateTo({
      url: '/pages/profile/badges'
    })
  },

  /**
   * 加载用户徽章
   */
  loadBadges: function() {
    API.user.getBadges().then(res => {
      if (res.success) {
        // 只保留已获得的徽章
        const earnedBadges = res.data.filter(badge => badge.earned);
        
        // 为每个已获得的徽章添加详情和获取条件
        const badgesWithDetails = earnedBadges.map(badge => ({
          ...badge,
          // 假设从API获取的徽章包含基本信息，这里添加详情和获取条件
          details: this.getBadgeDetails(badge.name),
          conditions: this.getBadgeConditions(badge.name)
        }));
        
        const badges = {
          count: badgesWithDetails.length,
          list: badgesWithDetails
        };
        this.setData({
          badges: badges
        });
      }
    }).catch(error => {
      console.error('加载徽章失败:', error);
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
    const badge = this.data.badges.list[index];
    
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
  
  // 导航到收藏页面
  navigateToCollection: function() {
    if (!this.requireLogin()) return;
    wx.navigateTo({
      url: '/pages/profile/poems?type=collection'
    })
  },
  
  // 导航到录音作品页面
  navigateToRecordings: function() {
    if (!this.requireLogin()) return;
    wx.navigateTo({
      url: '/pages/profile/recordings'
    })
  },
  
  // 导航到设置页面
  navigateToSettings: function() {
    if (!this.requireLogin()) return;
    wx.navigateTo({
      url: '/pages/profile/settings'
    })
  },
  
  // 导航到学习提醒页面
  navigateToReminder: function() {
    if (!this.requireLogin()) return;
    wx.navigateTo({
      url: '/pages/profile/reminder'
    })
  },
  
  // 导航到家长中心页面
  navigateToParentCenter: function() {
    if (!this.requireLogin()) return;
    wx.navigateTo({
      url: '/pages/profile/parent-center'
    })
  },
  
  // 导航到帮助与反馈页面
  navigateToHelp: function() {
    // 帮助与反馈可以不登录访问
    wx.navigateTo({
      url: '/pages/profile/help-feedback'
    })
  },
  
  // 导航到登录页面
  navigateToLogin: function() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },
  
  /**
   * 用户点击获取信息
   */
  getUserProfile() {
    const that = this;
    
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 获取微信登录code
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 调用微信登录API
              auth.loginWithWechat(res.userInfo, loginRes.code).then(result => {
                if (result.success) {
                  that.setData({
                    userInfo: auth.getUserInfo(),
                    isLogin: true,
                    showUserInfoModal: false
                  });
                  
                  // 重新加载学习数据
                  that.loadUserStudyData();
                } else {
                  wx.showToast({
                    title: result.message || '登录失败',
                    icon: 'none'
                  });
                }
              }).catch(error => {
                console.error('微信登录异常:', error);
                wx.showToast({
                  title: '登录失败，请稍后重试',
                  icon: 'none'
                });
              });
            } else {
              wx.showToast({ title: '微信登录失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.showToast({ title: '微信登录失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        that.setData({
          showUserInfoModal: false
        });
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 切换底部导航
  switchTab: function(e) {
    const path = e.currentTarget.dataset.path;
    if (path) {
      wx.switchTab({
        url: path
      })
    }
  },
  
  /**
   * 退出登录
   */
  logout() {
    if (!this.requireLogin()) return;
    // 调用退出登录方法
    auth.logout();
    
    this.setData({
      userInfo: {
        name: '未登录',
        level: ''
      },
      isLogin: false,
      showAvatar: false,
      // 重置学习数据为初始状态
      studyProgress: {
        learned: 0,
        total: 0,
        percentage: 0
      },
      badges: {
        count: 0,
        list: []
      },
      collection: {
        count: 0
      },
      recordings: []
    });
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  }
})