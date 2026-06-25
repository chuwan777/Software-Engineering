// pages/profile/poem-detail.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');

Page({
  data: {
    poem: null,
    isLoading: true
  },

  onLoad: function(options) {
    const poemId = options.id;
    if (poemId) {
      this.loadPoemDetail(poemId);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  /**
   * 加载诗歌详情
   */
  loadPoemDetail: function(poemId) {
    this.setData({ isLoading: true });
    
    // 从服务器获取诗歌详情
    API.myPoems.getDetail(poemId).then(res => {
      if (res.success) {
        this.setData({
          poem: res.data
        });
      } else {
        wx.showToast({
          title: '获取诗歌详情失败',
          icon: 'none'
        });
        wx.navigateBack();
      }
    }).catch(error => {
      console.error('加载诗歌详情失败:', error);
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
   * 返回诗歌列表页
   */
  goBack: function() {
    wx.navigateBack();
  },

  /**
   * 编辑诗歌
   */
  editPoem: function() {
    const poemId = this.data.poem.id;
    wx.navigateTo({
      url: `/pages/profile/poem-edit?id=${poemId}`
    });
  },

  /**
   * 删除诗歌
   */
  deletePoem: function() {
    const poemId = this.data.poem.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这首诗歌吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true });
          
          // 发送删除请求
          API.myPoems.delete(poemId).then(res => {
            if (res.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              wx.navigateBack();
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
  }
});
