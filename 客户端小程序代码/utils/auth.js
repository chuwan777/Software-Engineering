// utils/auth.js
const config = require('../config.js');
const API = require('./api.js');

// JWT token键名
const TOKEN_KEY = 'user_token';
const USER_INFO_KEY = 'user_info';
const LOGIN_STATUS_KEY = 'is_login';
const REGISTERED_ACCOUNTS_KEY = 'registered_accounts'; // 已注册账户本地存储键名
const REMEMBERED_ACCOUNT_KEY = 'remembered_account'; // 记住的账号密码存储键名

// 字符串转ArrayBuffer
const stringToArrayBuffer = (str) => {
  const buffer = new ArrayBuffer(str.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buffer;
};

// ArrayBuffer转字符串
const arrayBufferToString = (buffer) => {
  const view = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < view.length; i++) {
    str += String.fromCharCode(view[i]);
  }
  return str;
};

// 简单的加密函数（实际应用中建议使用更安全的加密算法）
const encrypt = (str) => {
  const key = 'poetry_app_secret_key_2024';
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode ^ keyCode);
  }
  // 使用微信小程序的Base64编码
  const buffer = stringToArrayBuffer(result);
  return wx.arrayBufferToBase64(buffer);
};

// 简单的解密函数
const decrypt = (str) => {
  const key = 'poetry_app_secret_key_2024';
  let result = '';
  // 使用微信小程序的Base64解码
  const buffer = wx.base64ToArrayBuffer(str);
  const decodedStr = arrayBufferToString(buffer);
  for (let i = 0; i < decodedStr.length; i++) {
    const charCode = decodedStr.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode ^ keyCode);
  }
  return result;
};

module.exports = {
  /**
   * 保存已注册账户信息到本地存储
   * @param {Object} accountInfo 账户信息 {username, password, userInfo}
   */
  saveAccount: function(accountInfo) {
    try {
      const accounts = this.getRegisteredAccounts();
      // 检查账户是否已存在
      const index = accounts.findIndex(acc => acc.username === accountInfo.username);
      if (index > -1) {
        // 更新现有账户
        accounts[index] = {
          ...accounts[index],
          ...accountInfo,
          updateTime: new Date().getTime()
        };
      } else {
        // 添加新账户
        accounts.push({
          ...accountInfo,
          createTime: new Date().getTime(),
          updateTime: new Date().getTime()
        });
      }
      wx.setStorageSync(REGISTERED_ACCOUNTS_KEY, accounts);
      return true;
    } catch (error) {
      console.error('保存账户信息失败:', error);
      return false;
    }
  },

  /**
   * 获取所有已注册账户
   * @returns {Array} 已注册账户列表
   */
  getRegisteredAccounts: function() {
    try {
      const accounts = wx.getStorageSync(REGISTERED_ACCOUNTS_KEY);
      return accounts || [];
    } catch (error) {
      console.error('获取账户列表失败:', error);
      return [];
    }
  },

  /**
   * 根据用户名获取账户信息
   * @param {string} username 用户名
   * @returns {Object|null} 账户信息
   */
  getAccountByUsername: function(username) {
    try {
      const accounts = this.getRegisteredAccounts();
      return accounts.find(acc => acc.username === username) || null;
    } catch (error) {
      console.error('获取账户信息失败:', error);
      return null;
    }
  },

  /**
   * 保存登录信息
   * @param {Object} userInfo 用户信息
   * @param {string} token JWT令牌
   */
  saveLoginInfo: function(userInfo, token) {
    try {
      wx.setStorageSync(USER_INFO_KEY, userInfo);
      wx.setStorageSync(TOKEN_KEY, token);
      wx.setStorageSync(LOGIN_STATUS_KEY, true);
      
      // 更新全局用户信息
      const app = getApp();
      if (app) {
        app.globalData.userInfo = userInfo;
      }
      
      // 如果用户信息包含用户名，更新本地账户信息
      if (userInfo.username) {
        this.saveAccount({
          username: userInfo.username,
          userInfo: userInfo
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存登录信息失败:', error);
      wx.showToast({
        title: '登录信息保存失败',
        icon: 'none'
      });
      return false;
    }
  },

  /**
   * 获取用户信息
   * @returns {Object|null} 用户信息
   */
  getUserInfo: function() {
    try {
      const userInfo = wx.getStorageSync(USER_INFO_KEY);
      return userInfo;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  /**
   * 获取JWT令牌
   * @returns {string|null} JWT令牌
   */
  getToken: function() {
    try {
      const token = wx.getStorageSync(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('获取令牌失败:', error);
      return null;
    }
  },

  /**
   * 检查是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn: function() {
    try {
      const isLogin = wx.getStorageSync(LOGIN_STATUS_KEY);
      const token = this.getToken();
      return !!isLogin && !!token;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  },

  /**
   * 清除登录信息
   */
  clearLoginInfo: function() {
    try {
      wx.removeStorageSync(USER_INFO_KEY);
      wx.removeStorageSync(TOKEN_KEY);
      wx.removeStorageSync(LOGIN_STATUS_KEY);
      
      // 清除全局用户信息
      const app = getApp();
      if (app) {
        app.globalData.userInfo = null;
      }
    } catch (error) {
      console.error('清除登录信息失败:', error);
    }
  },

  /**
   * 验证JWT令牌有效性
   * @returns {Promise<boolean>} 令牌是否有效
   */
  validateToken: function() {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve(false);
    }
    
    return API.auth.validate().then(res => {
      if (res.success) {
        return true;
      } else {
        this.clearLoginInfo();
        return false;
      }
    }).catch(error => {
      console.error('验证令牌失败:', error);
      // 如果是401错误，清除登录信息
      if (error.message === '认证失败') {
        this.clearLoginInfo();
      }
      return false;
    });
  },

  /**
   * 刷新JWT令牌
   * @returns {Promise<Object>} 刷新结果
   */
  refreshToken: function() {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve({ success: false, message: '令牌不存在' });
    }
    
    return API.auth.refresh().then(res => {
      if (res.success) {
        const { token } = res.data;
        wx.setStorageSync(TOKEN_KEY, token);
        return { success: true, token };
      } else {
        this.clearLoginInfo();
        return { 
          success: false, 
          message: res.message || '刷新令牌失败' 
        };
      }
    }).catch(error => {
      console.error('刷新令牌失败:', error);
      // 如果是401错误，清除登录信息
      if (error.message === '认证失败') {
        this.clearLoginInfo();
      }
      return { 
        success: false, 
        message: error.message || '网络异常，请稍后重试' 
      };
    });
  },

  /**
   * 账号密码登录
   * @param {string} username 账号
   * @param {string} password 密码
   * @param {boolean} rememberMe 是否记住密码
   * @returns {Promise<Object>} 登录结果
   */
  loginWithAccount: function(username, password, rememberMe = false) {
    return API.auth.login({
      username,
      password
    }).then(res => {
      if (res.success) {
        const { token, userInfo } = res.data;
        // 保存登录信息
        this.saveLoginInfo(userInfo, token);
        // 保存账户信息到本地持久化存储
        this.saveAccount({
          username: username,
          password: encrypt(password), // 加密存储密码
          userInfo: userInfo
        });
        
        // 如果选择记住密码，加密存储账号密码
        if (rememberMe) {
          wx.setStorageSync(REMEMBERED_ACCOUNT_KEY, {
            username: username,
            password: encrypt(password)
          });
        } else {
          // 清除记住的密码
          wx.removeStorageSync(REMEMBERED_ACCOUNT_KEY);
        }
        
        return { success: true, userInfo, token };
      } else {
        return { 
          success: false, 
          message: res.message || '登录失败' 
        };
      }
    }).catch(error => {
      console.error('登录请求失败:', error);
      return { 
        success: false, 
        message: '网络异常，请稍后重试' 
      };
    });
  },
  


  /**
   * 退出登录
   */
  logout: function() {
    this.clearLoginInfo();
    
    // 跳转到登录页
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  /**
   * 获取记住的账号密码
   * @returns {Object|null} 记住的账号密码信息
   */
  getRememberedAccount: function() {
    try {
      const rememberedAccount = wx.getStorageSync(REMEMBERED_ACCOUNT_KEY);
      if (rememberedAccount) {
        // 解密密码
        return {
          username: rememberedAccount.username,
          password: decrypt(rememberedAccount.password)
        };
      }
      return null;
    } catch (error) {
      console.error('获取记住的账号密码失败:', error);
      return null;
    }
  },



  /**
   * 检查本地存储的登录状态
   * @returns {boolean} 是否已登录
   */
  checkLocalLoginStatus: function() {
    try {
      const isLogin = wx.getStorageSync(LOGIN_STATUS_KEY);
      const token = this.getToken();
      const userInfo = this.getUserInfo();
      return !!isLogin && !!token && !!userInfo;
    } catch (error) {
      console.error('检查本地登录状态失败:', error);
      return false;
    }
  }
};