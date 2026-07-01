// pages/index/index.js
const app = getApp();

Page({
  data: {
    achievements: [],
    loading: true,
    showMenu: false,
    years: [],
    months: [],
    selectedYear: null,
    selectedMonth: null,
    allAchievements: [],
    stats: {
      totalCount: 0,
      thisMonthCount: 0,
      avgRating: 0,
    },
  },

  onLoad() {
    this.loadAchievements();
  },

  onShow() {
    this.loadAchievements();
  },

  loadAchievements() {
    this.setData({ loading: true });
    const db = wx.cloud.database();
    db.collection('achievements')
      .orderBy('createDate', 'desc')
      .get()
      .then(res => {
        const data = res.data.map(item => {
          const starRating = parseInt(item.starRating) || 0;
          return {
            ...item,
            starArray: Array(starRating).fill(0),
          };
        });
        this.setData({
          achievements: data,
          allAchievements: data,
          loading: false,
        });
        this.parseYears(data);
        this.calculateStats(data);
      })
      .catch(err => {
        console.error('加载成就失败', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none',
        });
      });
  },

  parseYears(data) {
    const yearMap = {};
    data.forEach(item => {
      if (item.createTime) {
        const year = item.createTime.substring(0, 4);
        yearMap[year] = true;
      }
    });
    const years = Object.keys(yearMap).sort((a, b) => b - a);
    this.setData({ years });
  },

  parseMonths(year) {
    const monthMap = {};
    this.data.allAchievements.forEach(item => {
      if (item.createTime && item.createTime.startsWith(year)) {
        const month = item.createTime.substring(5, 7);
        monthMap[month] = true;
      }
    });
    const months = Object.keys(monthMap).sort((a, b) => b - a);
    this.setData({ months });
  },

  calculateStats(data) {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    let totalCount = data.length;
    let thisMonthCount = 0;
    let totalRating = 0;

    data.forEach(item => {
      if (item.createTime && item.createTime.startsWith(currentMonthPrefix)) {
        thisMonthCount++;
      }
      totalRating += parseInt(item.starRating) || 0;
    });

    const avgRating = totalCount > 0 ? (totalRating / totalCount).toFixed(1) : 0;

    this.setData({
      stats: {
        totalCount,
        thisMonthCount,
        avgRating,
        avgStarArray: Array(Math.round(avgRating)).fill(0),
      },
    });
  },

  toggleMenu() {
    this.setData({
      showMenu: !this.data.showMenu,
      selectedYear: null,
      selectedMonth: null,
    });
  },

  closeMenu() {
    this.setData({ showMenu: false });
  },

  selectYear(e) {
    const year = e.currentTarget.dataset.year;
    if (this.data.selectedYear === year) {
      this.setData({ selectedYear: null, months: [], selectedMonth: null });
    } else {
      this.parseMonths(year);
      this.setData({ selectedYear: year, selectedMonth: null });
    }
  },

  selectMonth(e) {
    const month = e.currentTarget.dataset.month;
    const year = this.data.selectedYear;
    this.setData({ selectedMonth: month });
    
    const filtered = this.data.allAchievements.filter(item => {
      return item.createTime && item.createTime.startsWith(`${year}-${month}`);
    });
    this.setData({ achievements: filtered, showMenu: false });
  },

  clearFilter() {
    this.setData({
      achievements: this.data.allAchievements,
      selectedYear: null,
      selectedMonth: null,
      months: [],
      showMenu: false,
    });
  },

  goToAddAchievement() {
    wx.navigateTo({
      url: '/pages/add-achievement/add-achievement',
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/achievement-detail/achievement-detail?id=${id}`,
    });
  },

  deleteAchievement(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('achievements').doc(id).remove()
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
              });
              this.loadAchievements();
            })
            .catch(err => {
              console.error('删除失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none',
              });
            });
        }
      },
    });
  },

  onShareAppMessage() {
    return {
      title: '私人成就系统 - 记录每一个精彩瞬间',
      path: '/pages/index/index',
    };
  },
});
