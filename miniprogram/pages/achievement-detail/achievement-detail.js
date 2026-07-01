// pages/achievement-detail/achievement-detail.js
Page({
  data: {
    achievement: null,
    loading: true,
  },

  onLoad(options) {
    if (options.id) {
      this.loadAchievement(options.id);
    }
  },

  loadAchievement(id) {
    const db = wx.cloud.database();
    db.collection('achievements').doc(id).get()
      .then(res => {
        const data = {
          ...res.data,
          starArray: Array(res.data.starRating).fill(0),
        };
        this.setData({
          achievement: data,
          loading: false,
        });
      })
      .catch(err => {
        console.error('加载成就详情失败', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none',
        });
      });
  },

  goBack() {
    wx.navigateBack();
  },

  editAchievement() {
    const id = this.data.achievement._id;
    wx.navigateTo({
      url: `/pages/add-achievement/add-achievement?id=${id}`,
    });
  },

  onShareAppMessage() {
    const achievement = this.data.achievement;
    return {
      title: achievement ? `${achievement.content.substring(0, 20)}...` : '私人成就系统',
      path: `/pages/achievement-detail/achievement-detail?id=${achievement._id}`,
    };
  },
});
