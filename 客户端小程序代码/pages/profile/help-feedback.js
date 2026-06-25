// help-feedback.js
Page({
  data: {
    // 常见问题列表
    faqs: [
      {
        id: 1,
        question: '如何开始学习古诗？',
        answer: '在首页点击"开始学习"按钮，选择你想要学习的古诗即可开始学习之旅。',
        expanded: false
      },
      {
        id: 2,
        question: '如何保存我的录音作品？',
        answer: '在录音完成后，点击"保存"按钮即可将你的录音作品保存到"我的录音"中。',
        expanded: false
      },
      {
        id: 3,
        question: '如何收藏喜欢的古诗？',
        answer: '在古诗详情页点击右上角的收藏按钮，即可将古诗添加到你的收藏夹中。',
        expanded: false
      },
      {
        id: 4,
        question: '学习进度如何计算？',
        answer: '学习进度根据你已学习和已掌握的古诗数量计算，每首古诗学习完成后会自动更新进度。',
        expanded: false
      },
      {
        id: 5,
        question: '如何获得更多徽章？',
        answer: '完成每日学习任务、连续学习多天、掌握更多古诗等都可以获得不同的徽章奖励。',
        expanded: false
      }
    ],
    // 反馈类型
    feedbackTypes: ['功能建议', '内容错误', '技术问题', '其他'],
    selectedFeedbackType: '功能建议',
    // 反馈内容
    feedbackContent: '',
    // 联系方式
    contactInfo: '',
    // 上传的图片列表
    images: []
  },

  onLoad: function(options) {
    // 页面加载时可以从服务器获取常见问题等数据
  },

  // 展开/收起常见问题
  toggleFaq: function(e) {
    const id = e.currentTarget.dataset.id;
    const faqs = this.data.faqs;
    const updatedFaqs = faqs.map(faq => {
      if (faq.id === id) {
        return { ...faq, expanded: !faq.expanded };
      }
      return faq;
    });
    this.setData({
      faqs: updatedFaqs
    });
  },

  // 选择反馈类型
  selectFeedbackType: function(e) {
    this.setData({
      selectedFeedbackType: e.currentTarget.dataset.type
    });
  },

  // 输入反馈内容
  inputFeedbackContent: function(e) {
    this.setData({
      feedbackContent: e.detail.value
    });
  },

  // 输入联系方式
  inputContactInfo: function(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  // 选择图片
  chooseImage: function() {
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        this.setData({
          images: [...this.data.images, ...tempFilePaths]
        });
      }
    });
  },

  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({
      images: images
    });
  },

  // 提交反馈
  submitFeedback: function() {
    const { selectedFeedbackType, feedbackContent, contactInfo, images } = this.data;

    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    // 这里可以添加提交反馈到服务器的逻辑
    wx.showLoading({
      title: '提交中...',
    });

    // 模拟提交成功
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '反馈提交成功',
        icon: 'success'
      });
      // 重置表单
      this.setData({
        selectedFeedbackType: '功能建议',
        feedbackContent: '',
        contactInfo: '',
        images: []
      });
    }, 1500);
  },

  // 联系客服
  contactCustomerService: function() {
    // 这里可以添加联系客服的逻辑
    wx.showToast({
      title: '联系客服',
      icon: 'success'
    });
  },

  // 关于我们
  aboutUs: function() {
    // 这里可以添加关于我们的逻辑
    wx.showToast({
      title: '关于我们',
      icon: 'success'
    });
  }
});