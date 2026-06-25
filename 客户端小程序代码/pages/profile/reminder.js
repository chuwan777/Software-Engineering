// reminder.js
Page({
  data: {
    // 学习提醒开关状态
    isReminderEnabled: true,
    // 提醒时间
    reminderTime: '08:00',
    // 提醒频率
    reminderFrequency: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    // 已选择的提醒频率
    selectedFrequency: ['周一', '周二', '周三', '周四', '周五'],
    // 提醒内容
    reminderContent: '该开始今天的古诗学习啦！',
    // 自定义提醒内容
    customContent: ''
  },

  onLoad: function(options) {
    // 页面加载时可以从缓存获取已保存的设置
    this.loadReminderSettings();
  },

  // 加载提醒设置
  loadReminderSettings: function() {
    const settings = wx.getStorageSync('reminder_settings');
    if (settings) {
      this.setData({
        isReminderEnabled: settings.isReminderEnabled !== undefined ? settings.isReminderEnabled : true,
        reminderTime: settings.reminderTime || '08:00',
        selectedFrequency: settings.selectedFrequency || ['周一', '周二', '周三', '周四', '周五'],
        reminderContent: settings.reminderContent || '该开始今天的古诗学习啦！'
      });
    }
  },

  // 保存提醒设置
  saveReminderSettings: function() {
    const settings = {
      isReminderEnabled: this.data.isReminderEnabled,
      reminderTime: this.data.reminderTime,
      selectedFrequency: this.data.selectedFrequency,
      reminderContent: this.data.reminderContent
    };
    wx.setStorageSync('reminder_settings', settings);
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    });
  },

  // 切换提醒开关
  toggleReminder: function(e) {
    this.setData({
      isReminderEnabled: e.detail.value
    });
    this.saveReminderSettings();
  },

  // 选择提醒时间
  bindTimeChange: function(e) {
    this.setData({
      reminderTime: e.detail.value
    });
    this.saveReminderSettings();
  },

  // 选择提醒频率
  selectFrequency: function(e) {
    const day = e.currentTarget.dataset.day;
    const selectedFrequency = this.data.selectedFrequency;
    let newSelectedFrequency = [];

    if (selectedFrequency.includes(day)) {
      // 如果已选中，则取消选中
      newSelectedFrequency = selectedFrequency.filter(item => item !== day);
    } else {
      // 如果未选中，则添加选中
      newSelectedFrequency = [...selectedFrequency, day];
    }

    this.setData({
      selectedFrequency: newSelectedFrequency
    });
    this.saveReminderSettings();
  },

  // 选择提醒内容
  selectReminderContent: function(e) {
    this.setData({
      reminderContent: e.currentTarget.dataset.content
    });
    this.saveReminderSettings();
  },

  // 自定义提醒内容
  inputCustomContent: function(e) {
    this.setData({
      customContent: e.detail.value
    });
  },

  // 保存自定义提醒内容
  saveCustomContent: function() {
    if (this.data.customContent.trim()) {
      this.setData({
        reminderContent: this.data.customContent.trim()
      });
      this.saveReminderSettings();
      this.setData({
        customContent: ''
      });
    }
  }
});