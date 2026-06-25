// pages/login/login.js
const auth = require('../../utils/auth.js');
const ErrorHandler = require('../../utils/errorHandler.js');

Page({
  data: {
    loginType: 'account', // 登录方式：account
    username: '',        // 账号
    password: '',        // 密码
    rememberMe: true,    // 记住我
    isLoading: false,    // 登录中状态
    showBgImage: false   // 背景图片是否显示
  },

  onReady: function() {
    // 页面渲染完成后延迟显示背景图片，实现懒加载
    setTimeout(() => {
      this.setData({ showBgImage: true });
    }, 100);
  },
  
  /**
   * 输入框变化
   */
  handleInput(e) {
    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    this.setData({
      [key]: value
    });
  },

  /**
   * 记住我切换
   */
  handleRemember(e) {
    this.setData({
      rememberMe: e.detail.value
    });
  },



  /**
   * 账号密码登录
   */
  handleAccountLogin() {
    const { username, password, rememberMe } = this.data;
    
    // 前端验证
    if (!username) {
      ErrorHandler.handleValidationError('账号', { type: 'required' });
      return;
    }
    
    if (!password) {
      ErrorHandler.handleValidationError('密码', { type: 'required' });
      return;
    }
    
    if (password.length < 6) {
      ErrorHandler.handleValidationError('密码', { type: 'password' });
      return;
    }

    this.setData({ isLoading: true });

    // 调用登录API
    auth.loginWithAccount(username, password, '123456', rememberMe).then(result => {
      if (result.success) {
        ErrorHandler.showSuccess('登录成功');

        // 1. 使用事件通道通知前一个页面（如果是从首页导航过来的情况）
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel && typeof eventChannel.emit === 'function') {
          eventChannel.emit('loginSuccess', { success: true });
        }
        
        // 2. 触发全局事件通知所有页面（适用于switchTab的情况）
        const app = getApp();
        if (app.globalData && app.globalData.eventBus) {
          app.globalData.eventBus.trigger('loginSuccess');
        }

        // 跳转首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      } else {
        ErrorHandler.handleLoginError({ message: result.message || '登录失败' });
      }
    }).catch(error => {
      console.error('登录异常:', error);
      ErrorHandler.handleLoginError(error);
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否已登录
    const isLogin = wx.getStorageSync('isLogin');
    if (isLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});