/**
 * API请求工具类
 * 统一处理网络请求、认证、错误处理等
 */
const config = require('../config.js');
const errorHandler = require('./errorHandler.js');
const cache = require('./cache.js');

// 缓存配置
const CACHE_CONFIG = {
  // 是否启用缓存
  enabled: true,
  // 默认缓存时间（毫秒）
  defaultExpire: 5 * 60 * 1000,
  // 不缓存的URL模式
  excludePatterns: ['/api/auth/', '/api/poems/favorite', '/api/poems/history']
};

// 创建一个请求队列，用于处理并发请求
const requestQueue = [];

/**
 * 检查URL是否需要缓存
 * @param {string} url URL地址
 * @returns {boolean} 是否需要缓存
 */
function shouldCache(url, method) {
  if (!CACHE_CONFIG.enabled || method.toUpperCase() !== 'GET') {
    return false;
  }
  
  for (const pattern of CACHE_CONFIG.excludePatterns) {
    if (url.includes(pattern)) {
      return false;
    }
  }
  
  return true;
}

/**
 * API请求工具类
 */
const API = {
  /**
   * 通用请求方法
   * @param {Object} options 请求选项
   * @param {string} options.url 请求URL
   * @param {string} options.method 请求方法
   * @param {Object} options.data 请求数据
   * @param {Object} options.header 请求头
   * @param {boolean} options.showLoading 是否显示加载提示
   * @param {boolean} options.enableCache 是否启用缓存
   * @param {number} options.cacheExpire 缓存时间（毫秒）
   * @returns {Promise<Object>} 请求结果
   */
  request: function(options) {
    const {
      url,
      method = 'GET',
      data = {},
      header = {},
      showLoading = true,
      enableCache = true,
      cacheExpire = CACHE_CONFIG.defaultExpire
    } = options;
    
    // 完整URL
    const fullUrl = url.startsWith('http') ? url : `${config.apiBase}${url}`;
    
    // 检查是否需要缓存且缓存存在
    if (enableCache && shouldCache(fullUrl, method)) {
      const cacheKey = `api_${fullUrl}_${JSON.stringify(data)}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return Promise.resolve(cachedData);
      }
    }
    
    // 显示加载提示
    if (showLoading) {
      errorHandler.showLoading();
    }
    
    // 准备请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    };
    
    // 添加认证令牌（动态获取，避免循环依赖）
    let token = null;
    try {
      const auth = require('./auth.js');
      token = auth.getToken();
    } catch (error) {
      console.error('获取认证令牌失败:', error);
    }
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`;
    }
    
    return new Promise((resolve, reject) => {
      // 发送请求
      wx.request({
        url: fullUrl,
        method: method,
        data: data,
        header: requestHeader,
        success: (res) => {
          // 隐藏加载提示
          if (showLoading) {
            errorHandler.hideLoading();
          }
          
          // 处理响应
          this.handleResponse(res, resolve, reject, fullUrl, data, enableCache, cacheExpire);
        },
        fail: (error) => {
          // 隐藏加载提示
          if (showLoading) {
            errorHandler.hideLoading();
          }
          
          // 处理请求失败
          this.handleRequestFail(error, reject);
        }
      });
    });
  },
  
  /**
   * 处理响应
   * @param {Object} res 响应结果
   * @param {Function} resolve 成功回调
   * @param {Function} reject 失败回调
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {boolean} enableCache 是否启用缓存
   * @param {number} cacheExpire 缓存时间（毫秒）
   */
  handleResponse: function(res, resolve, reject, url, data, enableCache, cacheExpire) {
    const { statusCode, data: responseData } = res;
    
    // 检查状态码
    if (statusCode === 401) {
      // 认证失败，由调用方处理登录信息清除和跳转
      errorHandler.handleLoginError({ code: 401 });
      reject(new Error('认证失败'));
      return;
    }
    
    if (statusCode !== 200) {
      // 请求失败
      const errorMsg = responseData.message || `请求失败（${statusCode}）`;
      errorHandler.showError(errorMsg);
      reject(new Error(errorMsg));
      return;
    }
    
    // 检查业务逻辑
    if (responseData && responseData.success) {
      // 请求成功，处理缓存
      if (enableCache && shouldCache(url, 'GET')) {
        const cacheKey = `api_${url}_${JSON.stringify(data)}`;
        cache.set(cacheKey, responseData, cacheExpire);
      }
      
      resolve(responseData);
    } else {
      // 业务逻辑失败
      const errorMsg = responseData.message || '请求失败';
      errorHandler.showError(errorMsg);
      reject(new Error(errorMsg));
    }
  },
  
  /**
   * 处理请求失败
   * @param {Object} error 错误对象
   * @param {Function} reject 失败回调
   */
  handleRequestFail: function(error, reject) {
    const errorMsg = errorHandler.handleRequestError(error);
    reject(new Error(errorMsg));
  },
  
  /**
   * GET请求
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {Object} options 额外选项
   * @returns {Promise<Object>} 请求结果
   */
  get: function(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data,
      ...options
    });
  },
  
  /**
   * POST请求
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {Object} options 额外选项
   * @returns {Promise<Object>} 请求结果
   */
  post: function(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    });
  },
  
  /**
   * PUT请求
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {Object} options 额外选项
   * @returns {Promise<Object>} 请求结果
   */
  put: function(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    });
  },
  
  /**
   * DELETE请求
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {Object} options 额外选项
   * @returns {Promise<Object>} 请求结果
   */
  delete: function(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    });
  },
  
  /**
   * 批量请求
   * @param {Array<Object>} requests 请求列表
   * @returns {Promise<Array<Object>>} 请求结果列表
   */
  batchRequest: function(requests) {
    return Promise.all(requests.map(req => this.request(req)));
  },
  
  /**
   * 古诗相关API
   */
  poems: {
    /**
     * 获取古诗列表
     * @param {Object} params 查询参数
     * @returns {Promise<Object>} 古诗列表
     */
    getList: function(params = {}) {
      return API.get('/api/poems', params, {
        showLoading: true
      });
    },
    
    /**
     * 获取古诗详情
     * @param {number} id 古诗ID
     * @returns {Promise<Object>} 古诗详情
     */
    getDetail: function(id) {
      return API.get(`/api/poems/${id}`);
    },
    
    /**
     * 收藏古诗
     * @param {number} id 古诗ID
     * @returns {Promise<Object>} 操作结果
     */
    favorite: function(id) {
      return API.post(`/api/poems/${id}/favorite`);
    },
    
    /**
     * 取消收藏古诗
     * @param {number} id 古诗ID
     * @returns {Promise<Object>} 操作结果
     */
    unfavorite: function(id) {
      return API.delete(`/api/poems/${id}/favorite`);
    },
    
    /**
     * 获取收藏列表
     * @param {Object} params 查询参数
     * @returns {Promise<Object>} 收藏列表
     */
    getFavorites: function(params = {}) {
      return API.get('/api/poems/favorites', params);
    },
    
    /**
     * 添加阅读历史
     * @param {number} id 古诗ID
     * @returns {Promise<Object>} 操作结果
     */
    addHistory: function(id) {
      return API.post(`/api/poems/${id}/history`);
    },
    
    /**
     * 获取阅读历史
     * @param {Object} params 查询参数
     * @returns {Promise<Object>} 阅读历史
     */
    getHistory: function(params = {}) {
      return API.get('/api/poems/history', params);
    },
    
    /**
     * 搜索古诗
     * @param {string} keyword 搜索关键词
     * @param {Object} params 查询参数
     * @returns {Promise<Object>} 搜索结果
     */
    search: function(keyword, params = {}) {
      return API.get('/api/poems/search', {
        keyword,
        ...params
      });
    }
  },
  
  /**
   * 认证相关API
   */
  auth: {
    /**
     * 账号密码登录
     * @param {Object} data 登录数据
     * @returns {Promise<Object>} 登录结果
     */
    login: function(data) {
      return API.post('/api/auth/login', data, {
        showLoading: true
      });
    },
    
    /**
     * 用户注册
     * @param {Object} data 注册数据
     * @returns {Promise<Object>} 注册结果
     */
    register: function(data) {
      return API.post('/api/auth/register', data, {
        showLoading: true
      });
    },
    
    /**
     * 微信登录
     * @param {Object} data 登录数据
     * @returns {Promise<Object>} 登录结果
     */
    wechatLogin: function(data) {
      return API.post('/api/auth/wechat', data, {
        showLoading: true
      });
    },
    
    /**
     * 发送验证码
     * @param {Object} data 发送数据
     * @returns {Promise<Object>} 发送结果
     */
    sendCode: function(data) {
      return API.post('/api/auth/send-code', data, {
        showLoading: false
      });
    },
    
    /**
     * 验证令牌
     * @returns {Promise<Object>} 验证结果
     */
    validate: function() {
      return API.get('/api/auth/validate', {}, {
        showLoading: false
      });
    },
    
    /**
     * 刷新令牌
     * @returns {Promise<Object>} 刷新结果
     */
    refresh: function() {
      return API.post('/api/auth/refresh', {}, {
        showLoading: false
      });
    }
  },
  
  /**
   * 用户相关API
   */
  user: {
    /**
     * 获取用户信息
     * @returns {Promise<Object>} 用户信息
     */
    getInfo: function() {
      return API.get('/api/user/info', {}, {
        showLoading: false
      });
    },
    
    /**
     * 获取用户徽章
     * @returns {Promise<Object>} 用户徽章列表
     */
    getBadges: function() {
      return API.get('/api/user/badges', {}, {
        showLoading: true
      });
    }
  },
  
  /**
   * 个人中心相关API
   */
  profile: {
    /**
     * 获取用户学习数据
     * @returns {Promise<Object>} 用户学习数据
     */
    getProfile: function() {
      return API.get('/api/profile', {}, {
        showLoading: true
      });
    }
  },
  
  /**
   * 学习相关API
   */
  learn: {
    /**
     * 标记诗歌学习完成
     * @param {number} poemId 诗歌ID
     * @returns {Promise<Object>} 更新结果
     */
    complete: function(poemId) {
      return API.post('/api/learn/complete', { poemId }, {
        showLoading: true
      });
    }
  },
  
  /**
   * 个人诗歌相关API
   */
  myPoems: {
    /**
     * 获取个人诗歌列表
     * @param {Object} params 请求参数
     * @returns {Promise<Object>} 诗歌列表
     */
    getList: function(params = {}) {
      return API.get('/api/my-poems', params, {
        showLoading: true
      });
    },
    
    /**
     * 获取个人诗歌详情
     * @param {string} id 诗歌ID
     * @returns {Promise<Object>} 诗歌详情
     */
    getDetail: function(id) {
      return API.get(`/api/my-poems/${id}`, {}, {
        showLoading: true
      });
    },
    
    /**
     * 删除个人诗歌
     * @param {string} id 诗歌ID
     * @returns {Promise<Object>} 删除结果
     */
    delete: function(id) {
      return API.delete(`/api/my-poems/${id}`, {}, {
        showLoading: true
      });
    },
    
    /**
     * 保存个人诗歌（新增或编辑）
     * @param {Object} data 诗歌数据
     * @param {string} id 诗歌ID（编辑时需要）
     * @returns {Promise<Object>} 保存结果
     */
    save: function(data, id = null) {
      if (id) {
        // 编辑模式
        return API.put(`/api/my-poems/${id}`, data, {
          showLoading: true
        });
      } else {
        // 新增模式
        return API.post(`/api/my-poems`, data, {
          showLoading: true
        });
      }
    }
  },
  
  /**
   * 诗歌分类相关API
   */
  poemCategories: {
    /**
     * 获取诗歌分类列表
     * @returns {Promise<Object>} 分类列表
     */
    getList: function() {
      return API.get('/api/poem-categories', {}, {
        showLoading: true
      });
    }
  },

  /**
   * 录音相关API
   */
  recordings: {
    /**
     * 获取录音列表
     * @param {Object} params 请求参数
     * @returns {Promise<Object>} 录音列表
     */
    getList: function(params = {}) {
      return API.get('/api/recordings', params, {
        showLoading: true
      });
    },

    /**
     * 获取录音详情
     * @param {string} id 录音ID
     * @returns {Promise<Object>} 录音详情
     */
    getDetail: function(id) {
      return API.get(`/api/recordings/${id}`, {}, {
        showLoading: true
      });
    },

    /**
     * 删除录音
     * @param {string} id 录音ID
     * @returns {Promise<Object>} 删除结果
     */
    delete: function(id) {
      return API.delete(`/api/recordings/${id}`, {}, {
        showLoading: true
      });
    },

    /**
     * 保存录音
     * @param {Object} data 录音数据
     * @returns {Promise<Object>} 保存结果
     */
    save: function(data) {
      return API.post('/api/recordings', data, {
        showLoading: true
      });
    }
  }
};

module.exports = API;
