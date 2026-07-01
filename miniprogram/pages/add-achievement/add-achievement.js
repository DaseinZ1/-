// pages/add-achievement/add-achievement.js
Page({
  data: {
    content: '',
    starRating: 0,
    showStarPicker: false,
    editId: null,
    imageUrl: '',
    uploading: false,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑时刻' });
      this.loadAchievement(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '记录时刻' });
    }
  },

  loadAchievement(id) {
    const db = wx.cloud.database();
    db.collection('achievements').doc(id).get()
      .then(res => {
        this.setData({
          content: res.data.content,
          starRating: parseInt(res.data.starRating) || 0,
          imageUrl: res.data.imageUrl || '',
        });
      })
      .catch(err => {
        console.error('加载成就失败', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none',
        });
      });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadImage(tempFilePath);
      },
    });
  },

  uploadImage(tempFilePath) {
    this.setData({ uploading: true });
    const cloudPath = `images/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`;
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
      success: (res) => {
        this.setData({
          imageUrl: res.fileID,
          uploading: false,
        });
        wx.showToast({
          title: '上传成功',
          icon: 'success',
        });
      },
      fail: (err) => {
        console.error('上传失败', err);
        this.setData({ uploading: false });
        wx.showToast({
          title: '上传失败',
          icon: 'none',
        });
      },
    });
  },

  deleteImage() {
    this.setData({ imageUrl: '' });
  },

  onInputContent(e) {
    this.setData({
      content: e.detail.value,
    });
  },

  selectStar(e) {
    const star = parseInt(e.currentTarget.dataset.star);
    this.setData({
      starRating: star,
    });
  },

  submitAchievement() {
    const { content } = this.data;
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none',
      });
      return;
    }

    if (this.data.starRating === 0) {
      this.setData({ showStarPicker: true });
      return;
    }

    if (this.data.editId) {
      this.updateAchievement();
    } else {
      this.saveAchievement();
    }
  },

  confirmRating() {
    if (this.data.starRating === 0) {
      wx.showToast({
        title: '请选择心情星级',
        icon: 'none',
      });
      return;
    }

    if (this.data.editId) {
      this.updateAchievement();
    } else {
      this.saveAchievement();
    }
  },

  saveAchievement() {
    const db = wx.cloud.database();
    const now = new Date();
    const createTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    db.collection('achievements').add({
      data: {
        content: this.data.content.trim(),
        starRating: this.data.starRating,
        createTime: createTime,
        createDate: now.getTime(),
        imageUrl: this.data.imageUrl,
      },
    })
    .then(() => {
      wx.showToast({
        title: '保存成功',
        icon: 'success',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    })
    .catch(err => {
      console.error('保存失败', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none',
      });
    });
  },

  updateAchievement() {
    const db = wx.cloud.database();

    db.collection('achievements').doc(this.data.editId).update({
      data: {
        content: this.data.content.trim(),
        starRating: this.data.starRating,
        imageUrl: this.data.imageUrl,
      },
    })
    .then(() => {
      wx.showToast({
        title: '修改成功',
        icon: 'success',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    })
    .catch(err => {
      console.error('修改失败', err);
      wx.showToast({
        title: '修改失败',
        icon: 'none',
      });
    });
  },

  cancelStarPicker() {
    this.setData({
      showStarPicker: false,
    });
  },
});
