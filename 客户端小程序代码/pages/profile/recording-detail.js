// pages/profile/recording-detail.js
const API = require('../../utils/api.js');
const Cache = require('../../utils/cache.js');

Page({
  data: {
    recording: null,
    isLoading: true,
    isPlaying: false,
    audioManager: null
  },

  onLoad(options) {
    wx.setNavigationBarTitle({ title: '录音详情' });
    
    // 获取录音ID
    const recordingId = options.id;
    if (!recordingId) {
      wx.showToast({ title: '录音ID错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    
    // 初始化音频管理器
    this.setData({
      audioManager: wx.createInnerAudioContext()
    });
    
    // 加载录音详情
    this.loadRecordingDetail(recordingId);
  },

  onUnload() {
    // 清理音频资源
    if (this.data.audioManager) {
      this.data.audioManager.stop();
      this.data.audioManager.destroy();
    }
  },

  /**
   * 加载录音详情
   */
  loadRecordingDetail(recordingId) {
    this.setData({ isLoading: true });
    
    const cacheKey = `recording_detail_${recordingId}`;
    
    // 尝试从缓存获取
    const cachedData = Cache.get(cacheKey);
    if (cachedData) {
      this.setData({
        recording: cachedData,
        isLoading: false
      });
      return;
    }
    
    // 从服务器获取录音详情
    API.recordings.getDetail(recordingId)
      .then(res => {
        if (res.success && res.data) {
          // 保存到缓存
          Cache.set(cacheKey, res.data);
          
          this.setData({
            recording: res.data,
            isLoading: false
          });
        } else {
          wx.showToast({ title: '录音不存在', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      })
      .catch(error => {
        console.error('加载录音详情失败:', error);
        wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
        this.setData({ isLoading: false });
      });
  },

  /**
   * 播放/暂停录音
   */
  togglePlay() {
    if (!this.data.recording) return;
    
    const audioManager = this.data.audioManager;
    
    if (this.data.isPlaying) {
      // 暂停播放
      audioManager.pause();
      this.setData({ isPlaying: false });
    } else {
      // 开始播放
      audioManager.src = this.data.recording.url;
      audioManager.play();
      this.setData({ isPlaying: true });
      
      // 播放完成事件
      audioManager.onEnded(() => {
        this.setData({ isPlaying: false });
      });
      
      // 播放错误事件
      audioManager.onError((error) => {
        console.error('播放录音失败:', error);
        wx.showToast({ title: '播放失败，请稍后重试', icon: 'none' });
        this.setData({ isPlaying: false });
      });
    }
  },

  /**
   * 删除录音
   */
  deleteRecording() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个录音吗？',
      success: (res) => {
        if (res.confirm) {
          const recordingId = this.data.recording.id;
          
          // 从服务器删除录音
          API.recordings.delete(recordingId)
            .then(res => {
              if (res.success) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 返回上一页，并强制刷新上一页的数据
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            })
            .catch(error => {
              console.error('删除录音失败:', error);
              wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' });
            });
        }
      }
    });
  },

  /**
   * 分享录音
   */
  handleShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 页面分享给好友
   */
  onShareAppMessage() {
    const { name, duration, id } = this.data.recording;
    return {
      title: `我的录音：${name}`,
      path: `/pages/profile/recording-detail?id=${id}`,
    };
  },

  /**
   * 页面分享到朋友圈
   */
  onShareTimeline() {
    const { name, duration, id } = this.data.recording;
    return {
      title: `我的录音：${name}`,
      query: `id=${id}`,
    };
  },

  /**
   * 格式化录音时长
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
});