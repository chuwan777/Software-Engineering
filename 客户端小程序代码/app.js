// app.js
const config = require('./config.js');
const ErrorHandler = require('./utils/errorHandler.js');
const API = require('./utils/api.js');
App({
  onLaunch() {
    // 初始化兼容性设置
    this.initCompatibility();
    
    // 注册全局错误监听
    this.registerGlobalErrorHandlers();
  },

  globalData: {
    userInfo: null,
    systemInfo: null,
    safeArea: null,
    isDarkMode: false,
    isLogin: false,
    eventBus: {
      events: {},
      on: function(event, callback) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(callback);
      },
      emit: function(event, data) {
        if (this.events[event]) {
          this.events[event].forEach(callback => callback(data));
        }
      },
      trigger: function(event, data) {
        this.emit(event, data);
      }
    }
  },
  
  /**
   * 初始化兼容性设置
   */
  initCompatibility() {
    // 获取设备信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 设置安全区域
    const safeArea = systemInfo.safeArea || { top: 0, bottom: 0 };
    this.globalData.safeArea = safeArea;
    
    // 设置安全区域CSS变量
    if (wx.createSelectorQuery) {
      wx.createSelectorQuery()
        .select('page')
        .boundingClientRect()
        .exec((res) => {
          if (res && res[0]) {
            wx.setCssVar('--safe-area-top', `${safeArea.top}px`);
            wx.setCssVar('--safe-area-bottom', `${systemInfo.windowHeight - safeArea.bottom}px`);
          }
        });
    }
    
    // 检测深色模式
    if (systemInfo.theme) {
      this.globalData.isDarkMode = systemInfo.theme === 'dark';
      wx.setCssVar('--is-dark-mode', this.globalData.isDarkMode ? '1' : '0');
    }
    
    // 监听深色模式变化
    if (wx.onThemeChange) {
      wx.onThemeChange((res) => {
        this.globalData.isDarkMode = res.theme === 'dark';
        wx.setCssVar('--is-dark-mode', this.globalData.isDarkMode ? '1' : '0');
      });
    }
    
    // 检测版本兼容性
    this.checkVersionCompatibility();
  },
  
  /**
   * 检查版本兼容性
   */
  checkVersionCompatibility() {
    const version = wx.getSystemInfoSync().SDKVersion;
    const [major, minor, patch] = version.split('.').map(Number);
    
    // 示例：检查是否支持某个API
    if (major < 2 || (major === 2 && minor < 10)) {
      console.warn('当前微信版本较低，可能不支持部分功能');
    }
  },

  /**
   * 注册全局错误处理
   */
  registerGlobalErrorHandlers() {
    // 监听小程序错误
    wx.onError((error) => {
      console.error('全局错误:', error);
      // 可以在这里记录错误日志到服务器
      // 注意：不要在onError中调用wx.showToast，会导致死循环
    });

    // 监听页面不存在错误
    wx.onPageNotFound((res) => {
      console.error('页面不存在:', res);
      wx.redirectTo({
        url: '/pages/index/index'
      });
    });

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      if (!res.isConnected) {
        ErrorHandler.showError('网络连接已断开');
      }
    });
  },

  /**
   * 检查登录状态（用于按需登录）
   * @returns {boolean} 是否已登录
   */
  checkLoginStatus() {
    const auth = require('./utils/auth.js');
    return auth.isLoggedIn();
  },

  /**
   * 按需获取用户信息
   */
  getUserInfo() {
    const auth = require('./utils/auth.js');
    if (auth.isLoggedIn()) {
      API.user.getInfo()
        .then(res => {
          if (res.success) {
            this.globalData.userInfo = res.data;
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
    }
  }
});
