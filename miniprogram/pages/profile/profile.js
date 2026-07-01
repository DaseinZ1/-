// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    stats: {
      totalCount: 0,
      avgRating: 0,
      highRatingCount: 0,
    },
  },

  onLoad() {
    if (wx.getUserProfile) {
      this.setData({ canIUseGetUserProfile: true });
    }
    this.loadUserInfo();
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true,
      });
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于展示用户昵称和头像',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          userInfo,
          hasUserInfo: true,
        });
        wx.setStorageSync('userInfo', userInfo);
        
        this.updateUserInfo(userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
      },
    });
  },

  updateUserInfo(userInfo) {
    const db = wx.cloud.database();
    db.collection('users').where({
      _openid: '{openid}',
    }).get().then(res => {
      if (res.data.length > 0) {
        db.collection('users').doc(res.data[0]._id).update({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            updateTime: new Date().getTime(),
          },
        });
      } else {
        db.collection('users').add({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            createTime: new Date().getTime(),
          },
        });
      }
    });
  },

  loadStats() {
    const db = wx.cloud.database();
    db.collection('achievements').get().then(res => {
      const data = res.data;
      let totalCount = data.length;
      let totalRating = 0;
      let highRatingCount = 0;

      data.forEach(item => {
        const rating = parseInt(item.starRating) || 0;
        totalRating += rating;
        if (rating >= 4) {
          highRatingCount++;
        }
      });

      const avgRating = totalCount > 0 ? (totalRating / totalCount).toFixed(1) : 0;

      this.setData({
        stats: {
          totalCount,
          avgRating,
          highRatingCount,
        },
      });
    }).catch(err => {
      console.error('加载统计失败', err);
    });
  },

  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            userInfo: null,
            hasUserInfo: false,
          });
          wx.showToast({
            title: '已清除缓存',
            icon: 'success',
          });
        }
      },
    });
  },

  onShareAppMessage() {
    return {
      title: '私人成就系统 - 记录每一个精彩瞬间',
      path: '/pages/index/index',
      imageUrl: '',
    };
  },
});
