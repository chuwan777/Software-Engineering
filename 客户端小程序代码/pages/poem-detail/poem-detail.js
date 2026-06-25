// pages/poem-detail/poem-detail.js
const API = require('../../utils/api.js');
Page({
  data: {
    poem: null,           // 当前诗词详情
    isLoading: true,      // 加载状态
    loadFailed: false,    // 加载失败状态
    isCollected: false,   // 是否已收藏
    contentLines: [],     // 诗词内容行
    from: 'system',       // 来源：system(系统古诗)、my(我的作品)、collection(我的收藏)
    isUserPoem: false     // 是否是用户自己的作品
  },

  // 所有诗词数据缓存
  allPoems: [],

  onLoad(options) {
    const poemId = options.id;
    const from = options.from || 'system';
    const imageUrl = options.imageUrl ? decodeURIComponent(options.imageUrl) : '';
    
    if (!poemId) {
      wx.showToast({ title: '诗词ID错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ 
      isLoading: true, 
      loadFailed: false,
      from: from,
      isUserPoem: from === 'my'
    });

    // 尝试从本地data/poems.js获取数据
    try {
      const localPoems = require('../../data/poems').data;
      const poem = localPoems.find(p => p.id == poemId);
      
      if (poem) {
        // 如果是从learn页面过来的，且有图片URL，更新数据中的图片
        const finalPoem = from === 'learn' && imageUrl ? { ...poem, imageUrl } : poem;
        
        // 处理诗词内容，按行拆分
        const contentLines = finalPoem.content.split('\n');

        // 设置页面数据
        this.setData({
          poem: finalPoem,
          contentLines: contentLines,
          isLoading: false,
          loadFailed: false
        }, () => {
          this.checkCollectionStatus(poemId);
          wx.setNavigationBarTitle({ title: this.data.poem.title });
        });
        return;
      }
    } catch (error) {
      console.error('从本地数据文件加载失败：', error);
    }
    
    // 如果本地数据加载失败，尝试使用API获取
    const Cache = require('../../utils/cache');
    const cacheKey = `poem_detail_${from}_${poemId}`;
    
    // 尝试从缓存获取
    const cachedData = Cache.get(cacheKey);
    if (cachedData) {
      // 如果是从learn页面过来的，且有图片URL，更新缓存数据中的图片
      const finalPoem = from === 'learn' && imageUrl ? { ...cachedData, imageUrl } : cachedData;
      
      // 处理诗词内容，按行拆分
      const contentLines = finalPoem.content.split('\n');

      // 设置页面数据
      this.setData({
        poem: finalPoem,
        contentLines: contentLines,
        isLoading: false,
        loadFailed: false
      }, () => {
        this.checkCollectionStatus(poemId);
        wx.setNavigationBarTitle({ title: this.data.poem.title });
      });
      return;
    }
    
    // 根据来源调用不同的API
    let apiCall;
    if (from === 'my') {
      // 我的作品
      apiCall = API.myPoems.getDetail(poemId);
    } else {
      // 系统古诗或收藏
      apiCall = API.poems.getDetail(poemId);
    }
    
    apiCall
      .then(res => {
        if (res.success && res.data) {
          let poem = res.data;
          
          // 如果是从learn页面过来的，且有图片URL，更新数据中的图片
          if (from === 'learn' && imageUrl) {
            poem = { ...poem, imageUrl };
          }
          
          // 保存到缓存
          Cache.set(cacheKey, poem);
          
          // 处理诗词内容，按行拆分
          const contentLines = poem.content.split('\n');

          // 设置页面数据
          this.setData({
            poem: poem,
            contentLines: contentLines,
            isLoading: false,
            loadFailed: false
          }, () => {
            this.checkCollectionStatus(poemId);
            wx.setNavigationBarTitle({ title: this.data.poem.title });
          });
        } else {
          wx.showToast({ title: '诗词不存在', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      })
      .catch(err => {
        console.error('加载诗词详情失败：', err);
        this.setData({
          isLoading: false,
          loadFailed: true
        });
      });
  },

  /**
   * 加载所有诗词数据
   */
  loadAllPoems(callback) {
    this.setData({ isLoading: true, loadFailed: false });
    try {
      const res = require('../../data/poems');
      if (res && res.data && Array.isArray(res.data)) {
        this.allPoems = res.data;
        this.setData({ isLoading: false }, callback);
      } else {
        throw new Error('数据格式错误');
      }
    } catch (err) {
      console.error('加载诗词数据失败:', err);
      this.setData({
        isLoading: false,
        loadFailed: true
      });
      wx.showToast({ title: '数据加载失败', icon: 'none' });
    }
  },

  /**
   * 根据ID查找诗词
   */
  getPoemById(id) {
    return this.allPoems.find(poem => poem.id == id) || null;
  },

  /**
   * 检查收藏状态
   */
  checkCollectionStatus(poemId) {
    if (this.data.from === 'my') {
      // 自己的作品不能收藏
      this.setData({ isCollected: false });
      return;
    }
    
    // 尝试使用本地存储检查收藏状态
    const collectedPoems = wx.getStorageSync('collectedPoems') || [];
    this.setData({ isCollected: collectedPoems.includes(poemId) });
  },

  /**
   * 收藏/取消收藏
   */
  handleCollect(e) {
    const poemId = e.currentTarget.dataset.id;
    
    if (this.data.from === 'my') {
      wx.showToast({ title: '不能收藏自己的作品', icon: 'none' });
      return;
    }
    
    if (this.data.from === 'collection') {
      // 如果从收藏列表进入，取消收藏操作调用移除收藏API
      API.poems.unfavorite(poemId)
        .then(res => {
          if (res.success) {
            this.setData({ isCollected: false });
            wx.showToast({ title: '已取消收藏' });
            // 更新本地存储
            let collectedPoems = wx.getStorageSync('collectedPoems') || [];
            collectedPoems = collectedPoems.filter(id => id != poemId);
            wx.setStorageSync('collectedPoems', collectedPoems);
            // 触发页面返回时刷新收藏列表
            this.triggerEvent('collectionChanged');
          }
        })
        .catch(error => {
          console.error('取消收藏失败:', error);
          wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
        });
    } else {
      // 系统古诗的收藏/取消收藏
      if (this.data.isCollected) {
        // 取消收藏
        API.poems.unfavorite(poemId)
          .then(res => {
            if (res.success) {
              this.setData({ isCollected: false });
              wx.showToast({ title: '已取消收藏' });
              // 更新本地存储
              let collectedPoems = wx.getStorageSync('collectedPoems') || [];
              collectedPoems = collectedPoems.filter(id => id != poemId);
              wx.setStorageSync('collectedPoems', collectedPoems);
            }
          })
          .catch(error => {
            console.error('取消收藏失败:', error);
            wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
          });
      } else {
        // 收藏
        API.poems.favorite(poemId)
          .then(res => {
            if (res.success) {
              this.setData({ isCollected: true });
              wx.showToast({ title: '收藏成功' });
              // 更新本地存储
              let collectedPoems = wx.getStorageSync('collectedPoems') || [];
              if (!collectedPoems.includes(poemId)) {
                collectedPoems.push(poemId);
                wx.setStorageSync('collectedPoems', collectedPoems);
              }
            }
          })
          .catch(error => {
            console.error('收藏失败:', error);
            wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
          });
      }
    }
  },

  /**
   * 编辑诗歌
   */
  editPoem() {
    const poemId = this.data.poem.id;
    wx.navigateTo({
      url: `/pages/profile/poem-edit?id=${poemId}`
    });
  },

  /**
   * 删除诗歌
   */
  deletePoem() {
    const poemId = this.data.poem.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这首诗歌吗？',
      success: (res) => {
        if (res.confirm) {
          API.myPoems.delete(poemId)
            .then(res => {
              if (res.success) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 延迟返回上一页，让用户看到提示
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              }
            })
            .catch(error => {
              console.error('删除诗歌失败:', error);
              wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' });
            });
        }
      }
    });
  },

  /**
   * 分享诗词
   */
  handleShare() {
    const { title, author, dynasty } = this.data.poem;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 页面分享给好友
   */
  onShareAppMessage() {
    const { title, author, dynasty, id } = this.data.poem;
    return {
      title: `${title} - ${dynasty}·${author}`,
      path: `/pages/poem-detail/poem-detail?id=${id}`,
    };
  },

  /**
   * 页面分享到朋友圈
   */
  onShareTimeline() {
    const { title, author, dynasty, id } = this.data.poem;
    return {
      title: `${title} - ${dynasty}·${author}`,
      query: `id=${id}`,
    };
  },

  /**
   * 标记学习完成
   */
  markAsLearned() {
    // 只有系统古诗可以标记学习完成
    if (this.data.from === 'system') {
      const poemId = this.data.poem?.id;
      if (!poemId) {
        wx.showToast({ title: '诗词信息错误', icon: 'none' });
        return;
      }

      API.learn.complete(poemId)
        .then(res => {
          if (res.success) {
            wx.showToast({ title: '学习完成！', icon: 'success' });
            
            // 触发全局事件，通知首页更新学习进度
            const app = getApp();
            if (app.globalData && app.globalData.eventBus) {
              app.globalData.eventBus.trigger('learnComplete', res.data);
            }
          } else {
            wx.showToast({ title: '更新学习进度失败', icon: 'none' });
          }
        })
        .catch(err => {
          console.error('更新学习进度失败:', err);
          wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
        });
    } else {
      wx.showToast({ title: '此功能仅适用于系统古诗', icon: 'none' });
    }
  },

  /**
   * 重试加载
   */
  retryLoad() {
    const poemId = this.data.poem?.id;
    if (poemId) {
      this.onLoad({ id: poemId });
    } else {
      wx.navigateBack();
    }
  },

  /**
   * 图片加载成功事件处理
   */
  handleImageLoad() {
    console.log('诗词图片加载成功');
  },

  /**
   * 图片加载失败事件处理
   */
  handleImageError(e) {
    console.error('诗词图片加载失败:', e);
    // 可以在这里添加图片加载失败的降级处理，例如显示默认图片
  },

  /**
   * 保存诗歌功能
   */
  savePoem() {
    const { poem } = this.data;
    if (!poem) {
      wx.showToast({ title: '诗词数据为空', icon: 'none' });
      return;
    }

    // 1. 保存到本地存储
    const savedPoems = wx.getStorageSync('savedPoems') || [];
    const isSaved = savedPoems.some(item => item.id === poem.id);
    
    if (!isSaved) {
      savedPoems.push({
        id: poem.id,
        title: poem.title,
        author: poem.author,
        dynasty: poem.dynasty,
        content: poem.content,
        translation: poem.translation,
        tags: poem.tags,
        savedAt: new Date().toISOString()
      });
      wx.setStorageSync('savedPoems', savedPoems);
    }

    // 2. 保存为JSON文件
    const poemJson = JSON.stringify({
      title: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      content: poem.content,
      translation: poem.translation,
      tags: poem.tags
    }, null, 2);

    const fs = wx.getFileSystemManager();
    const fileName = `${poem.title}.json`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    fs.writeFile({
      filePath: filePath,
      data: poemJson,
      encoding: 'utf8',
      success: () => {
        console.log('文件保存成功:', filePath);
        wx.showToast({ title: '保存成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('保存文件失败:', err);
        wx.showToast({ title: '部分保存成功', icon: 'success' });
      }
    });
  }
});