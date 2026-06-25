// pages/profile/poems.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');

Page({
  data: {
    poems: [],
    categories: [],
    selectedCategory: '',
    searchKeyword: '',
    isLoading: false,
    showAddModal: false,
    showEditModal: false,
    currentPoem: null,
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    type: 'my', // 'my' 或 'collection'
    // 批量管理功能
    isBatchMode: false,
    selectedPoems: [],
    allSelected: false
  },

  onLoad: function(options) {
    // 设置显示类型
    this.setData({
      type: options.type || 'my'
    });
    
    // 根据类型设置导航栏标题
    if (this.data.type === 'collection') {
      wx.setNavigationBarTitle({ title: '我的收藏' });
    } else {
      wx.setNavigationBarTitle({ title: '我的作品' });
    }
    
    this.loadCategories();
    this.loadPoems();
  },

  /**
   * 切换批量管理模式
   */
  toggleBatchMode: function() {
    this.setData({
      isBatchMode: !this.data.isBatchMode,
      selectedPoems: [],
      allSelected: false
    });
  },

  /**
   * 选择/取消选择诗歌
   */
  toggleSelectPoem: function(e) {
    const poemId = e.currentTarget.dataset.id;
    let selectedPoems = [...this.data.selectedPoems];
    
    if (selectedPoems.includes(poemId)) {
      selectedPoems = selectedPoems.filter(id => id !== poemId);
    } else {
      selectedPoems.push(poemId);
    }
    
    this.setData({
      selectedPoems: selectedPoems,
      allSelected: selectedPoems.length === this.data.poems.length
    });
  },

  /**
   * 全选/取消全选
   */
  toggleSelectAll: function() {
    const allSelected = !this.data.allSelected;
    let selectedPoems = [];
    
    if (allSelected) {
      selectedPoems = this.data.poems.map(poem => poem.id);
    }
    
    this.setData({
      allSelected: allSelected,
      selectedPoems: selectedPoems
    });
  },

  /**
   * 批量删除所选诗歌
   */
  batchDeletePoems: function() {
    if (this.data.selectedPoems.length === 0) {
      wx.showToast({
        title: '请先选择要删除的诗歌',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除所选的 ${this.data.selectedPoems.length} 首诗歌吗？`,
      success: (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true });
          
          // 批量删除所选诗歌
          const deletePromises = this.data.selectedPoems.map(poemId => {
            const apiCall = this.data.type === 'collection' 
              ? API.poems.removeFavorite(poemId) 
              : API.myPoems.delete(poemId);
            return apiCall;
          });
          
          Promise.all(deletePromises).then(results => {
            const allSuccess = results.every(res => res.success);
            
            if (allSuccess) {
              wx.showToast({
                title: `成功删除 ${this.data.selectedPoems.length} 首诗歌`,
                icon: 'success'
              });
              
              // 重新加载数据
              this.setData({
                currentPage: 1,
                poems: [],
                hasMore: true,
                isBatchMode: false,
                selectedPoems: [],
                allSelected: false
              });
              this.loadPoems();
            } else {
              wx.showToast({
                title: '部分删除失败',
                icon: 'none'
              });
              // 重新加载数据以确保显示最新状态
              this.loadPoems();
            }
          }).catch(error => {
            console.error('批量删除失败:', error);
            wx.showToast({
              title: '批量删除失败，请稍后重试',
              icon: 'none'
            });
          }).finally(() => {
            this.setData({ isLoading: false });
          });
        }
      }
    });
  },

  onShow: function() {
    // 页面显示时重新加载数据
    this.setData({
      currentPage: 1,
      poems: [],
      hasMore: true
    });
    this.loadPoems();
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
   * 加载诗歌作品列表
   */
  loadPoems: function() {
    if (this.data.isLoading || !this.data.hasMore) return;
    
    this.setData({ isLoading: true });
    
    // 构建请求参数
    const params = {
      page: this.data.currentPage,
      pageSize: this.data.pageSize
    };
    
    if (this.data.selectedCategory) {
      params.category = this.data.selectedCategory;
    }
    
    if (this.data.searchKeyword) {
      params.search = this.data.searchKeyword;
    }
    
    // 根据类型选择不同的API
    const apiCall = this.data.type === 'collection' 
      ? API.poems.getFavorites(params) 
      : API.myPoems.getList(params);
    
    // 从服务器获取诗歌数据
    apiCall.then(res => {
      if (res.success) {
        const newPoems = res.data.list || [];
        const total = res.data.total || 0;
        
        this.setData({
          poems: [...this.data.poems, ...newPoems],
          currentPage: this.data.currentPage + 1,
          hasMore: this.data.poems.length + newPoems.length < total
        });
      }
    }).catch(error => {
      console.error('加载诗歌失败:', error);
      wx.showToast({
        title: '加载诗歌失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 执行搜索
   */
  onSearch: function() {
    this.setData({
      currentPage: 1,
      poems: [],
      hasMore: true
    });
    this.loadPoems();
  },

  /**
   * 清除搜索
   */
  clearSearch: function() {
    this.setData({
      searchKeyword: '',
      currentPage: 1,
      poems: [],
      hasMore: true
    });
    this.loadPoems();
  },

  /**
   * 选择分类
   */
  onCategoryChange: function(e) {
    const index = e.detail.value;
    const category = index !== null ? this.data.categories[index] : null;
    
    this.setData({
      selectedCategory: category ? category.name : '',
      currentPage: 1,
      poems: [],
      hasMore: true
    });
    this.loadPoems();
  },

  /**
   * 跳转到诗歌详情页
   */
  goToPoemDetail: function(e) {
    const poemId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/poem-detail/poem-detail?id=${poemId}&from=${this.data.type}`
    });
  },

  /**
   * 显示添加诗歌页面
   */
  showAddModal: function() {
    // 如果是收藏页面，不显示添加功能
    if (this.data.type === 'collection') return;
    
    wx.navigateTo({
      url: '/pages/profile/poem-edit'
    });
  },

  /**
   * 编辑诗歌
   */
  editPoem: function(e) {
    const poemId = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/profile/poem-edit?id=${poemId}`
    });
  },

  /**
   * 删除诗歌
   */
  deletePoem: function(e) {
    const poemId = e.currentTarget.dataset.id;
    
    // 显示确认对话框
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这首诗歌吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true });
          
          // 发送删除请求
          const apiCall = this.data.type === 'collection' 
            ? API.poems.removeFavorite(poemId) 
            : API.myPoems.delete(poemId);
          
          apiCall.then(res => {
            if (res.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              // 重新加载数据
              this.setData({
                currentPage: 1,
                poems: [],
                hasMore: true
              });
              this.loadPoems();
            } else {
              wx.showToast({
                title: res.message || '删除失败',
                icon: 'none'
              });
            }
          }).catch(error => {
            console.error('删除诗歌失败:', error);
            wx.showToast({
              title: '删除失败，请稍后重试',
              icon: 'none'
            });
          }).finally(() => {
            this.setData({ isLoading: false });
          });
        }
      }
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
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.setData({
      currentPage: 1,
      poems: [],
      hasMore: true
    });
    this.loadPoems();
    wx.stopPullDownRefresh();
  },

  /**
   * 上拉加载更多
   */
  onReachBottom: function() {
    this.loadPoems();
  }
});
