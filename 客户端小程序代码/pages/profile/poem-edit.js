// pages/profile/poem-edit.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');

Page({
  data: {
    poemId: null,
    isEditing: false,
    poem: {
      title: '',
      content: '',
      category: '',
      tags: []
    },
    categories: [],
    isLoading: false
  },

  onLoad: function(options) {
    const poemId = options.id;
    this.setData({
      poemId: poemId,
      isEditing: !!poemId
    });
    
    this.loadCategories();
    
    if (poemId) {
      this.loadPoemData(poemId);
    }
  },

  /**
   * 加载诗歌分类
   */
  loadCategories: function() {
    this.setData({ isLoading: true });
    
    // 从服务器获取分类数据
    API.poemCategories.getList().then(res => {
      if (res.success) {
        this.setData({
          categories: res.data
        });
      }
    }).catch(error => {
      console.error('加载分类失败:', error);
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },

  /**
   * 加载诗歌数据（编辑模式）
   */
  loadPoemData: function(poemId) {
    this.setData({ isLoading: true });
    
    // 从服务器获取诗歌详情
    API.myPoems.getDetail(poemId).then(res => {
      if (res.success) {
        this.setData({
          poem: res.data
        });
      } else {
        wx.showToast({
          title: '获取诗歌数据失败',
          icon: 'none'
        });
        wx.navigateBack();
      }
    }).catch(error => {
      console.error('加载诗歌数据失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
      wx.navigateBack();
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },

  /**
   * 输入框内容变化
   */
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`poem.${field}`]: value
    });
  },

  /**
   * 分类选择变化
   */
  onCategoryChange: function(e) {
    this.setData({
      'poem.category': e.detail.value
    });
  },

  /**
   * 保存诗歌
   */
  savePoem: function() {
    const poemData = this.data.poem;
    const poemId = this.data.poemId;
    
    // 数据验证
    if (!this.validatePoemData(poemData)) return;
    
    this.setData({ isLoading: true });
    
    // 发送保存请求
    API.myPoems.save(poemData, poemId).then(res => {
      if (res.success) {
        wx.showToast({
          title: this.data.isEditing ? '编辑成功' : '添加成功',
          icon: 'success'
        });
        wx.navigateBack();
      } else {
        wx.showToast({
          title: res.message || (this.data.isEditing ? '编辑失败' : '添加失败'),
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('保存诗歌失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },

  /**
   * 验证诗歌数据
   */
  validatePoemData: function(data) {
    if (!data.title || data.title.trim() === '') {
      wx.showToast({
        title: '请输入诗歌标题',
        icon: 'none'
      });
      return false;
    }
    
    if (!data.content || data.content.trim() === '') {
      wx.showToast({
        title: '请输入诗歌内容',
        icon: 'none'
      });
      return false;
    }
    
    if (!data.category) {
      wx.showToast({
        title: '请选择诗歌分类',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack();
  },

  /**
   * 获取当前选中分类的索引
   */
  getCategoryIndex: function() {
    const { categories, poem } = this.data;
    if (!poem.category || categories.length === 0) return 0;
    
    const index = categories.findIndex(category => category.name === poem.category);
    return index > -1 ? index : 0;
  }
});
