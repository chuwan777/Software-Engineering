/**
 * 全局错误处理工具类
 */
const ErrorHandler = {
  /**
   * 显示错误提示
   * @param {string} message 错误消息
   * @param {string} icon 图标类型，可选值：'none'、'error'、'success'、'loading'
   * @param {number} duration 显示时长（毫秒）
   */
  showError(message, icon = 'none', duration = 2000) {
    wx.showToast({
      title: message,
      icon: icon,
      duration: duration
    });
  },

  /**
   * 显示成功提示
   * @param {string} message 成功消息
   * @param {number} duration 显示时长（毫秒）
   */
  showSuccess(message, duration = 1500) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: duration
    });
  },

  /**
   * 处理网络请求错误
   * @param {Object} error 错误对象
   * @param {string} defaultMessage 默认错误消息
   */
  handleRequestError(error, defaultMessage = '网络请求失败') {
    console.error('请求错误:', error);
    
    let errorMsg = defaultMessage;
    
    // 根据错误类型定制错误消息
    if (error.errMsg) {
      if (error.errMsg.includes('request:fail')) {
        if (error.errMsg.includes('timeout')) {
          errorMsg = '请求超时，请检查网络';
        } else if (error.errMsg.includes('network')) {
          errorMsg = '网络连接失败，请检查网络';
        } else {
          errorMsg = '请求失败，请稍后重试';
        }
      }
    }
    
    this.showError(errorMsg);
    return errorMsg;
  },

  /**
   * 处理登录相关错误
   * @param {Object} error 错误对象
   * @param {string} defaultMessage 默认错误消息
   */
  handleLoginError(error, defaultMessage = '登录失败') {
    console.error('登录错误:', error);
    
    let errorMsg = defaultMessage;
    
    // 处理不同的登录错误情况
    if (error.errMsg) {
      if (error.errMsg.includes('login:fail')) {
        errorMsg = '微信登录失败，请稍后重试';
      } else if (error.errMsg.includes('getUserInfo:fail')) {
        errorMsg = '获取用户信息失败，请检查授权设置';
      }
    } else if (error.code === 401) {
      errorMsg = '登录已过期，请重新登录';
      // 清除本地登录信息
      const auth = require('./auth.js');
      auth.clearLoginInfo();
      // 跳转到登录页
      wx.redirectTo({ url: '/pages/login/login' });
    }
    
    this.showError(errorMsg);
    return errorMsg;
  },

  /**
   * 处理表单验证错误
   * @param {string} fieldName 字段名称
   * @param {string} errorType 错误类型
   */
  handleValidationError(fieldName, errorType) {
    const errorMessages = {
      required: `${fieldName}不能为空`,
      minLength: `${fieldName}长度不能少于${errorType.arg}个字符`,
      maxLength: `${fieldName}长度不能超过${errorType.arg}个字符`,
      pattern: `${fieldName}格式不正确`,
      phone: '手机号格式不正确',
      password: '密码长度不能少于6位'
    };
    
    const errorMsg = errorMessages[errorType.type] || `${fieldName}格式不正确`;
    this.showError(errorMsg);
    return errorMsg;
  },

  /**
   * 显示加载中提示
   * @param {string} title 提示标题
   */
  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title
    });
  },

  /**
   * 隐藏加载中提示
   */
  hideLoading() {
    wx.hideLoading();
  }
};

module.exports = ErrorHandler;