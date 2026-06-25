// pages/category/category.js
const auth = require('../../utils/auth.js');
const config = require('../../config');
const API = require('../../utils/api.js');
Page({
  data: {
    categoryType: '',    // 分类类型（tang/song/yuan/shijing/more）
    categoryName: '',    // 分类名称（如“唐诗”）
    poemList: [],        // 分类下的诗词列表
    filteredPoems: [],   // 搜索筛选后的列表
    searchValue: '',     // 搜索输入框的值
    isLoading: true,     // 是否正在加载
    loadFailed: false,   // 是否加载失败
    page: 1,             // 当前页码
    pageSize: 10,        // 每页显示数量
    hasMoreData: true,   // 是否有更多数据
    totalPoems: 0,       // 分类下诗词总数
    showBackTop: false   // 是否显示返回顶部按钮
  },

  // 页面加载时执行
  onLoad(options) {
    // 检查登录状态
    if (!auth.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    
    const type = options.type || '';
    if (!type) {
      wx.showToast({ title: '分类参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // 设置分类信息
    this.setData({
      categoryType: type,
      categoryName: this.getTypeToName(type)
    });

    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.categoryName
    });

    // 加载分类诗词数据
    this.fetchCategoryPoems();
  },

  // 将分类类型转换为显示名称
  getTypeToName(type) {
    const typeMap = {
      'tang': '唐诗',
      'song': '宋词',
      'yuan': '元曲',
      'shijing': '诗经',
      'more': '更多分类'
    };
    return typeMap[type] || '诗词分类';
  },

  // 加载分类诗词数据（核心逻辑）
  fetchCategoryPoems() {
    this.setData({ isLoading: true, loadFailed: false });

    const { categoryType, page, pageSize } = this.data;
    const Cache = require('../../utils/cache');
    
    // 根据分类类型设置筛选参数
    const params = { page, pageSize };
    let cacheKey = `poems_${categoryType}`;
    
    switch (categoryType) {
      case 'tang':
      case 'song':
      case 'yuan':
        params.dynasty = categoryType === 'tang' ? '唐' : 
                        categoryType === 'song' ? '宋' : '元';
        break;
      case 'shijing':
        params.category = '诗经';
        break;
      case 'more':
        // 更多分类：筛选非唐、宋、元且非诗经的诗词
        params.notDynasty = '唐,宋,元';
        params.notCategory = '诗经';
        break;
    }
    
    // 如果是第一页且不是刷新，尝试从缓存获取
    if (page === 1) {
      const cachedData = Cache.get(cacheKey);
      if (cachedData) {
        this.setData({
          poemList: cachedData.list,
          totalPoems: cachedData.total,
          isLoading: false,
          hasMoreData: cachedData.hasMore,
          loadFailed: false
        });
        return;
      }
    }

    API.poems.getList(params)
      .then(res => {
        if (res.success && res.data) {
          // 更新数据（如果是第一页则覆盖，否则追加）
          const updatedList = page === 1 ? res.data.list : [...this.data.poemList, ...res.data.list];

          this.setData({
            poemList: updatedList,
            totalPoems: res.data.total,
            isLoading: false,
            hasMoreData: res.data.hasMore, // 是否还有更多数据
            loadFailed: false
          });
          
          // 如果是第一页，保存到缓存
          if (page === 1) {
            Cache.set(cacheKey, res.data);
          }
        }
      })
      .catch(err => {
        console.error('加载分类诗词失败：', err);
        this.setData({
          isLoading: false,
          loadFailed: true
        });
      });
  },

  // 搜索输入框变化时触发
  handleSearchInput(e) {
    const value = e.detail.value.trim();
    this.setData({ searchValue: value });

    // 如果有搜索值，在当前分类列表中筛选
    if (value) {
      const filtered = this.data.poemList.filter(poem => 
        poem.title.includes(value) || 
        poem.author.includes(value) || 
        poem.content.includes(value)
      );
      this.setData({ filteredPoems: filtered });
    } else {
      // 没有搜索值，清空筛选结果
      this.setData({ filteredPoems: [] });
    }
  },

  // 清空搜索输入
  clearSearch() {
    this.setData({
      searchValue: '',
      filteredPoems: []
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    // 重置页码，重新加载第一页数据
    this.setData({
      page: 1,
      hasMoreData: true
    });
    this.fetchCategoryPoems(() => {
      wx.stopPullDownRefresh(); // 停止下拉刷新动画
    });
  },

  // 上拉加载更多
  onReachBottom() {
    // 如果没有加载中、有更多数据、且没有搜索值，才加载更多
    if (!this.data.isLoading && this.data.hasMoreData && !this.data.searchValue) {
      this.setData({ page: this.data.page + 1 });
      this.fetchCategoryPoems();
    }
  },

  // 监听页面滚动，控制返回顶部按钮显示
  onPageScroll(e) {
    // 滚动距离超过500px显示返回顶部按钮
    this.setData({
      showBackTop: e.scrollTop > 500
    });
  },

  // 返回顶部
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  // 跳转到诗词详情页
  goToPoemDetail(e) {
    const poemId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/poem-detail/poem-detail?id=${poemId}`,
      animationType: 'slide-in-right',
      animationDuration: 300
    });
  },

  // 重试加载数据
  retryLoadData() {
    this.setData({ page: 1, hasMoreData: true });
    this.fetchCategoryPoems();
  }
});