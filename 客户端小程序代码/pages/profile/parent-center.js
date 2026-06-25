// parent-center.js
Page({
  data: {
    // 孩子学习统计数据
    studyStats: {
      totalPoems: 100,
      learnedPoems: 25,
      masteredPoems: 15,
      avgDailyTime: '30分钟',
      streakDays: 7
    },
    // 最近学习记录
    recentStudyRecords: [
      {
        date: '2023-06-15',
        time: '15:30',
        content: '学习了《静夜思》',
        status: '已掌握'
      },
      {
        date: '2023-06-14',
        time: '16:45',
        content: '学习了《春晓》',
        status: '已学习'
      },
      {
        date: '2023-06-13',
        time: '14:20',
        content: '学习了《悯农》',
        status: '已掌握'
      }
    ],
    // 学习目标设置
    dailyGoal: 1,
    // 学习报告
    reportTypes: ['日报告', '周报告', '月报告'],
    selectedReportType: '周报告'
  },

  onLoad: function(options) {
    // 页面加载时可以从服务器获取数据
  },

  // 设置每日学习目标
  setDailyGoal: function(e) {
    this.setData({
      dailyGoal: e.detail.value
    });
    // 保存学习目标到服务器
    this.saveDailyGoal();
  },

  // 保存每日学习目标
  saveDailyGoal: function() {
    // 这里可以添加保存到服务器的逻辑
    wx.showToast({
      title: '目标已设置',
      icon: 'success'
    });
  },

  // 选择报告类型
  selectReportType: function(e) {
    this.setData({
      selectedReportType: e.currentTarget.dataset.type
    });
    // 这里可以添加加载对应报告的逻辑
  },

  // 查看学习报告
  viewStudyReport: function() {
    // 这里可以添加查看学习报告的逻辑
    wx.showToast({
      title: '查看学习报告',
      icon: 'success'
    });
  },

  // 查看详细学习记录
  viewStudyRecords: function() {
    // 这里可以添加查看详细学习记录的逻辑
    wx.showToast({
      title: '查看详细记录',
      icon: 'success'
    });
  },

  // 设置学习限制
  setStudyLimit: function() {
    // 这里可以添加设置学习限制的逻辑
    wx.showToast({
      title: '设置学习限制',
      icon: 'success'
    });
  }
});