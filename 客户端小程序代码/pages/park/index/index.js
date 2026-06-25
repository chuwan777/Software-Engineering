// pages/park/index/index.js
Page({
  data: {},

  onLoad() {},

  // 跳转到对应模块页面
  navigateTo(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({
      url: `/pages/park/${page}/${page}`
    });
  }
});