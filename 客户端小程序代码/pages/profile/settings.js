// settings.js
Page({
  data: {
    userInfo: {
      name: '用户',
      avatar: '/images/avatar.png'
    },
    settings: [
      {
        id: 'account',
        title: '账号与安全',
        icon: '🔐',
        items: [
          { name: '修改密码', url: '' },
          { name: '绑定手机号', url: '' },
          { name: '隐私设置', url: '' }
        ]
      },
      {
        id: 'notifications',
        title: '通知设置',
        icon: '🔔',
        items: [
          { name: '学习提醒', url: '' },
          { name: '系统通知', url: '' },
          { name: '消息推送', url: '' }
        ]
      },
      {
        id: 'appearance',
        title: '外观设置',
        icon: '🎨',
        items: [
          { name: '主题切换', url: '' },
          { name: '字体大小', url: '' }
        ]
      },
      {
        id: 'about',
        title: '关于',
        icon: 'ℹ️',
        items: [
          { name: '版本信息', url: '', value: '1.0.0' },
          { name: '用户协议', url: '/pages/agreement/agreement' },
          { name: '隐私政策', url: '/pages/privacy/privacy' },
          { name: '反馈建议', url: '' }
        ]
      }
    ]
  },

  onLoad: function(options) {
    // 页面加载时可以从全局或缓存获取用户信息
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
    }
  },

  onShow: function() {
    // 页面显示时可以刷新数据
  },

  // 处理设置项点击
  onSettingItemClick: function(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      wx.navigateTo({
        url: url
      });
    } else {
      // 没有URL的项可以显示提示
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.clearStorageSync();
          getApp().globalData.userInfo = null;
          getApp().globalData.isLogin = false;
          
          // 返回登录页面
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});