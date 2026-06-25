// pages/register/register.js
const auth = require('../../utils/auth.js');
const ErrorHandler = require('../../utils/errorHandler.js');
const API = require('../../utils/api.js');

Page({
  data: {
    username: '',        // 用户名
    password: '',        // 密码
    confirmPassword: '', // 确认密码
    isLoading: false,    // 注册中状态
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
   * 用户名验证
   */
  validateUsername(username) {
    return username.length >= 2 && username.length <= 20;
  },

  /**
   * 密码验证
   */
  validatePassword(password) {
    return password.length >= 6 && password.length <= 20;
  },

  /**
   * 确认密码验证
   */
  validateConfirmPassword(password, confirmPassword) {
    return password === confirmPassword;
  },

  /**
   * 账号注册
   */
  handleRegister() {
    const { username, password, confirmPassword } = this.data;
    
    // 前端验证
    if (!username) {
      ErrorHandler.handleValidationError('用户名', { type: 'required' });
      return;
    }
    
    if (!this.validateUsername(username)) {
      ErrorHandler.handleValidationError('用户名', { type: 'username' });
      return;
    }
    
    if (!password) {
      ErrorHandler.handleValidationError('密码', { type: 'required' });
      return;
    }
    
    if (!this.validatePassword(password)) {
      ErrorHandler.handleValidationError('密码', { type: 'password' });
      return;
    }
    
    if (!confirmPassword) {
      ErrorHandler.handleValidationError('确认密码', { type: 'required' });
      return;
    }
    
    if (!this.validateConfirmPassword(password, confirmPassword)) {
      ErrorHandler.handleValidationError('确认密码', { type: 'confirm' });
      return;
    }

    this.setData({ isLoading: true });

    // 调用注册API
    API.auth.register({
      username,
      password
    }).then(result => {
      if (result.success) {
        ErrorHandler.showSuccess('注册成功');

        // 自动登录
        return auth.loginWithAccount(username, password); // 不再需要验证码
      } else {
        ErrorHandler.handleLoginError({ message: result.message || '注册失败' });
        return Promise.reject(new Error(result.message || '注册失败'));
      }
    }).then(loginResult => {
      if (loginResult.success) {
        // 注册并登录成功，跳转首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      }
    }).catch(error => {
      console.error('注册或登录异常:', error);
      if (error.message !== '注册失败') {
        ErrorHandler.handleLoginError(error);
      }
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