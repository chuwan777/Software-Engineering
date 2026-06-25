// pages/profile/recordings.js
const auth = require('../../utils/auth.js');
const API = require('../../utils/api.js');
const Cache = require('../../utils/cache.js');
const ErrorHandler = require('../../utils/errorHandler.js');

Page({
  data: {
    recordings: [],
    isLoading: false,
    isRecording: false,
    isPlaying: false,
    currentRecording: null,
    recordingTime: 0,
    timer: null,
    audioManager: null,
    recorderManager: null
  },

  onLoad: function() {
    wx.setNavigationBarTitle({ title: '我的录音' });
    // 初始化音频管理器
    this.setData({
      audioManager: wx.createInnerAudioContext(),
      recorderManager: wx.getRecorderManager()
    });
    
    // 监听录音停止事件
    this.data.recorderManager.onStop((res) => {
      if (res.tempFilePath) {
        this.stopRecording(res.tempFilePath);
      } else {
        this.stopRecording(null);
      }
    });
    
    // 监听录音错误事件
    this.data.recorderManager.onError((error) => {
      console.error('录音失败:', error);
      wx.showToast({
        title: '录音失败，请稍后重试',
        icon: 'none'
      });
      this.stopRecording(null);
    });
    
    this.loadRecordings();
  },

  onUnload: function() {
    // 清理音频资源
    if (this.data.audioManager) {
      this.data.audioManager.stop();
      this.data.audioManager.destroy();
    }
    // 清理定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  /**
   * 页面显示时执行
   */
  onShow: function() {
    // 每次页面显示时，强制刷新录音列表，确保数据最新
    this.loadRecordings(true);
  },

  /**
   * 加载录音列表
   */
  loadRecordings: function(forceRefresh = false) {
    this.setData({ isLoading: true });

    const cacheKey = 'user_recordings';
    
    // 尝试从缓存获取数据（如果不是强制刷新）
    if (!forceRefresh) {
      const cachedData = Cache.get(cacheKey);
      if (cachedData) {
        this.setData({
          recordings: cachedData
        });
        this.setData({ isLoading: false });
        return;
      }
    }

    // 从服务器获取录音数据
    API.recordings.getList().then(res => {
      if (res.success) {
        this.setData({
          recordings: res.data || []
        });
        
        // 缓存录音数据，过期时间1小时
        Cache.set(cacheKey, res.data || [], 60 * 60 * 1000);
      } else {
        wx.showToast({
          title: '获取录音列表失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('加载录音失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ isLoading: false });
    });
  },

  /**
   * 开始录音
   */
  startRecording: function() {
    if (this.data.isRecording) return;
    
    this.setData({
      isRecording: true,
      recordingTime: 0
    });
    
    // 启动定时器，记录录音时长
    this.setData({
      timer: setInterval(() => {
        this.setData({
          recordingTime: this.data.recordingTime + 1
        });
      }, 1000)
    });
    
    // 开始录音（使用新的API）
    this.data.recorderManager.start({
      format: 'mp3',
      duration: 600000 // 最长录音时间10分钟
    });
    
    wx.showToast({
      title: '录音中...',
      icon: 'none'
    });
  },

  /**
   * 停止录音
   */
  stopRecording: function(param) {
    // 清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    
    this.setData({
      isRecording: false
    });
    
    // 隐藏录音提示
    wx.hideToast();
    
    // 检查参数类型
    if (param && typeof param === 'string') {
      // 如果是字符串，说明是录音文件路径（来自onStop事件）
      this.saveRecording(param);
    } else if (param && param.detail) {
      // 如果是事件对象（来自点击按钮），需要调用stop()
      this.data.recorderManager.stop();
    } else if (!param) {
      // 如果没有参数，也需要调用stop()
      this.data.recorderManager.stop();
    }
  },

  /**
   * 保存录音
   */
  saveRecording: function(tempFilePath) {
    const that = this;
    const duration = this.data.recordingTime;
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const title = `录音 ${now.getMonth() + 1}月${now.getDate()}日 ${timeStr}`;
    
    // 直接将录音数据保存到服务器
    API.recordings.save({
      title: title,
      duration: duration,
      url: tempFilePath, // 临时路径，实际项目中应该是永久URL
      recordedAt: timeStr
    }).then(res => {
      if (res.success) {
        // 添加到本地录音列表
        const newRecording = {
          id: res.data.id,
          title: res.data.title,
          duration: duration,
          createdAt: res.data.createdAt,
          url: res.data.url
        };
        
        const updatedRecordings = [newRecording, ...that.data.recordings];
        that.setData({
          recordings: updatedRecordings
        });
        
        // 更新缓存
        Cache.set('user_recordings', updatedRecordings, 60 * 60 * 1000);
        
        wx.showToast({
          title: '录音保存成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: res.message || '保存失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('保存录音失败:', error);
      wx.showToast({
        title: '保存失败，请稍后重试',
        icon: 'none'
      });
    });
  },

  /**
   * 播放录音
   */
  playRecording: function(e) {
    const recordingId = e.currentTarget.dataset.id;
    const recording = this.data.recordings.find(r => r.id === recordingId);
    
    if (!recording) return;
    
    if (this.data.isPlaying && this.data.currentRecording && this.data.currentRecording.id === recordingId) {
      // 如果正在播放当前录音，则停止播放
      this.stopPlay();
      return;
    }
    
    // 停止当前播放的录音
    this.stopPlay();
    
    // 设置当前播放的录音
    this.setData({
      isPlaying: true,
      currentRecording: recording
    });
    
    // 播放录音
    const audioManager = this.data.audioManager;
    audioManager.src = recording.url;
    
    audioManager.play();
    
    // 播放完成事件
    audioManager.onEnded(() => {
      this.setData({
        isPlaying: false,
        currentRecording: null
      });
    });
    
    // 播放错误事件
    audioManager.onError((error) => {
      console.error('播放录音失败:', error);
      wx.showToast({
        title: '播放失败，请稍后重试',
        icon: 'none'
      });
      this.setData({
        isPlaying: false,
        currentRecording: null
      });
    });
  },

  /**
   * 停止播放录音
   */
  stopPlay: function() {
    if (this.data.audioManager) {
      this.data.audioManager.stop();
    }
    
    this.setData({
      isPlaying: false,
      currentRecording: null
    });
  },

  /**
   * 删除录音
   */
  deleteRecording: function(e) {
    const recordingId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个录音吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true });
          
          // 从服务器删除录音
          API.recordings.delete(recordingId).then(res => {
            if (res.success) {
              // 强制从服务器刷新录音列表，确保数据一致性
              this.loadRecordings(true);
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: res.message || '删除失败',
                icon: 'none'
              });
            }
          }).catch(error => {
            console.error('删除录音失败:', error);
            wx.showToast({
              title: '网络异常，请稍后重试',
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
   * 格式化录音时长
   */
  formatDuration: function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * 跳转到录音详情页
   */
  goToRecordingDetail: function(e) {
    const recordingId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/profile/recording-detail?id=${recordingId}`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.loadRecordings();
    wx.stopPullDownRefresh();
  }
});
