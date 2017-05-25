let util = require('../../utils/util.js');
Page({
  data: {
    phone: '',
    verifyCode: '',
    leftTime: -1,
    isSendingCode: false
  },
  // 获得手机号码
  onPhoneInput: function(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 获得验证码
  onVerifyInput: function(e) {
    this.setData({
      verifyCode: e.detail.value
    });
  },

  // 发送验证码
  onSendVerifyCode: function() {
    let that = this;

    if (this.data.isSendingCode) return; //正在请求数据中

    // 验证手机号码
    let phoneNum = this.data.phone;

    if (!util.checkPhoneNum(phoneNum)) {
      util.toolTip.showToolTip('手机号格式有误');
      return;
    }

    wx.showLoading({
      title: '加载中',
      mask: true
    });

    // 设置数据
    this.setData({
      isSendingCode: true
    });

    let timestamp = parseInt(+new Date() / 1000);
    let apiToken = util.cryptoJS.MD5('tuandai_xcx' + timestamp);

    let param = {
      "phone": phoneNum,
      "type": 2
    };

    // 加密
    param = util.encrypt(JSON.stringify(param), timestamp);
    util.request({
      url: util.domain + '/user/send-verify-code.html',
      data: {
        t: timestamp,
        api_token: apiToken,
        param: param
      },
      success: function(res) {
        let data = res.data;
        // 解密
        data = util.decrypt(data.data, data.t);
        if (200 === data.code) {
          // 设置倒计时
          let leftTime = 60;
          that.setData({
            leftTime: leftTime
          });

          let si = setInterval(function countdown() {
            leftTime--;
            that.setData({
              leftTime: leftTime
            });

            // 倒计时结束
            if (leftTime < 0) {
              clearInterval(si);
            }
          }, 1000);

        } else {
          util.toolTip.showToolTip(data.message || '网络异常，请稍后再试');
        }
      },
      fail: function(err) {
        util.toolTip.showToolTip('网络异常，请稍后再试');
      },
      complete: function() {
        wx.hideLoading();

        that.setData({
          isSendingCode: false
        });
      }
    });
  },

  // 下一步
  onNext: function() {
    let phoneNum = this.data.phone;
    let verifyCode = this.data.verifyCode;

    // 验证手机号码
    if ('' === phoneNum) {
      util.toolTip.showToolTip('请输入手机号码');
      return;
    } else if (!util.checkPhoneNum(phoneNum)) {
      util.toolTip.showToolTip('手机号格式有误');
      return;
    }

    //验证验证码 
    if ('' === verifyCode) {
      util.toolTip.showToolTip('请输入验证码');
      return;
    } else if (verifyCode.length < 6) {
      util.toolTip.showToolTip('请输入正确的验证码');
      return;
    }

    // 保存验证码，用于重置密码
    wx.setStorageSync('resetObj', {
      "phone": phoneNum,
      "verifyCode": verifyCode
    });

    wx.navigateTo({
      url: '../user/resetpwd'
    })
  },

  onShow: function() {
    util.toolTip.init(this);
  }
})