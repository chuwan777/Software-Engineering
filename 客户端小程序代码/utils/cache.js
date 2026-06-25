// 缓存工具类
const Cache = {
  // 默认缓存时间：5分钟
  DEFAULT_EXPIRE_TIME: 5 * 60 * 1000,
  
  /**
   * 设置缓存
   * @param {string} key 缓存键名
   * @param {*} data 缓存数据
   * @param {number} expire 过期时间（毫秒）
   */
  set(key, data, expire = this.DEFAULT_EXPIRE_TIME) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expire: expire > 0 ? expire : 0
    };
    wx.setStorageSync(key, cacheData);
  },
  
  /**
   * 获取缓存
   * @param {string} key 缓存键名
   * @returns {*} 缓存数据，如果缓存不存在或已过期则返回null
   */
  get(key) {
    const cacheData = wx.getStorageSync(key);
    if (!cacheData) {
      return null;
    }
    
    // 检查是否过期
    if (cacheData.expire > 0 && Date.now() - cacheData.timestamp > cacheData.expire) {
      this.remove(key);
      return null;
    }
    
    return cacheData.data;
  },
  
  /**
   * 删除缓存
   * @param {string} key 缓存键名
   */
  remove(key) {
    wx.removeStorageSync(key);
  },
  
  /**
   * 清空所有缓存
   */
  clear() {
    wx.clearStorageSync();
  },
  
  /**
   * 检查缓存是否存在且未过期
   * @param {string} key 缓存键名
   * @returns {boolean} 是否有效
   */
  has(key) {
    return this.get(key) !== null;
  }
};

module.exports = Cache;