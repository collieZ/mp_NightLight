<template>
  <div class="container" @click="clickHandle('test click', $event)">
    <div class="userinfo">
      <img
        class="userinfo-avatar"
        v-if="userInfo.avatarUrl"
        :src="userInfo.avatarUrl"
        background-size="cover"
      >
      <div class="userinfo-nickname">
        <card :text="userInfo.nickName"></card>
      </div>
    </div>
    <!-- <a href="/pages/counter/main" class="counter">去往Vuex示例页面</a> -->
    <i-button type="info" @click="openBluetoothAdapter">蓝牙测试</i-button>
    <i-button type="primary" @click="listBLEDevice">查看搜寻的蓝牙</i-button>
    <i-button type="info" @click="showBLE">蓝牙弹出层</i-button>
    <i-button type="info" @click="showBLE">获取特征值</i-button>
    <!-- <i-button v-if="BLE.canWrite" type="info" @click="writeBLECharacteristicValue()">写数据</i-button> -->
    <i-button v-if="BLE.connected" type="primary" @click="showBLEControl">展开控制台</i-button>

    <van-popup :show="popupShow" position="right" @close="onPopupClose" :custom-class="popupRight">
      <i-button type="ghost" :size="'small'" shape="circle" :inline="true" @click="closePopup">关闭</i-button>
      <div
        v-for="(device, index) in allDevices"
        @click="createBLEConnection"
        :key="index"
        :class="{device_list: true}"
        :data-name="device.name"
        :data-device-id="device.deviceId"
      >
        <i-card
          :extra="(device.deviceId == BLE.deviceId && BLE.connected) ? '已连接' : '未连接'"
          :full="true"
          :thumb="(BLE.connected && device.deviceId==BLE.deviceId) ? devicePicUrl.link : devicePicUrl.unlink"
        >
          <view slot="content">
            <div>name: {{device.name}}</div>
            <div>deviceId: {{device.deviceId}}</div>
            <div>RSSI: {{device.RSSI}}</div>
          </view>
          <view slot="footer" v-if="(device.deviceId == BLE.deviceId && BLE.connected)">
            <i-button
              type="ghost"
              :size="'small'"
              shape="circle"
              :i-class="'disConnectBtn'"
              :inline="true"
              @click.stop="closeBLEConnection"
            >断开连接</i-button>
          </view>
        </i-card>
      </div>
    </van-popup>

    <van-popup
      :show="controlPopupShow"
      position="left"
      @close="onControlPopupClose"
      :custom-class="popupLeft"
    >
      <div class="colHeader">
        <i-button
          type="ghost"
          :size="'small'"
          shape="circle"
          :inline="true"
          @click="closeControlPopup"
        >关闭</i-button>
      </div>
      <i-divider color="#2d8cf0" lineColor="#C2C0C0"></i-divider>
      <div class="powerSwitch">
        <van-switch-cell title="开关" :checked="isLightOpen" @change="onlightStatusChange"/>
      </div>
      <div class="sliderControl">
        <div class="slideTitle">
          <span>光亮控制</span>
        </div>
        <van-slider value="50" @change="onLightSliderChange" min="0" max="100" bar-height="4px"/>
      </div>
      <div class="sliderControl">
        <div class="slideTitle">
          <span>光色控制</span>
        </div>
        <van-slider value="50" @change="onColorSliderChange" min="0" max="100" bar-height="4px"/>
      </div>
      <div class="breathLight">
        <img
          :src="breathLight.active"
          @click="breathHandle"
          v-if="!breathLight.isshaking"
          alt="呼吸灯开启"
          srcset
        >
        <img :src="breathLight.unactive" v-else @click="breathHandle" alt="呼吸灯关闭" srcset>
      </div>
    </van-popup>
    <!-- <i-button type="info" shape="circle" @click="toastTest">提示测试</i-button> -->
    <van-toast id="openTips"/>
    <van-toast id="breathLightTips"/>
    <van-toast id="breathLightClose"/>
  </div>
</template>

<script>
import card from "@/components/card";
import { inArray } from "@/utils/index";
import { ab2hex } from "@/utils/index";
import Toast from "../../../static/vant/toast/toast";
import { setInterval } from 'timers';

export default {
  data() {
    return {
      userInfo: {},
      // 蓝牙变量
      devicePicUrl: {
        unlink: "https://i.loli.net/2018/12/04/5c0623e49b6eb.png",
        link: "https://i.loli.net/2018/12/04/5c0629bf138cb.png"
      },
      // 呼吸状态变量
      breathLightStatus: "",
      breathLight: {
        active: "https://i.loli.net/2018/12/10/5c0e162aab42c.png",
        unactive: "https://i.loli.net/2018/12/10/5c0e19cd9ca8a.png",
        isshaking: false
      },
      allDevices: [],
      chs: [],
      BLE: {
        connected: false,
        name: "",
        deviceId: "",
        serviceId: "",
        characteristicId: "",
        canWrite: false
      },
      _discoveryStarted: false, // 蓝牙搜寻全局变量
      // UI变量
      popupShow: false,
      controlPopupShow: false,
      popupLeft: "popupLeft",
      popupRight: "popupRight",
      isLightOpen: false
    };
  },
  components: {
    card
  },
  computed: {
    breathLightStatus() {
      let BL = this.breathLight;
      if (!BL.isshaking) {
        const url = require(`${BL.active}`);
        console.log("url is : ", url);
        return url;
      } else {
        return require(`${BL.unactive}`);
      }
    }
  },
  watch: {
    "BLE.connected": {
      handler: function(newVal, oldVal) {
        console.log(newVal, oldVal);
        if (newVal && !oldVal) {
        }
      },
      deep: true
    }
  },
  methods: {
    toastConnect() {
      const toast = Toast.success({
        selector: "#openTips",
        message: "连接成功",
        duration: 1000 // 持续展示 toast
      });
    },
    toastBreathLight() {
      const toast = Toast.success({
        selector: "#breathLightTips",
        message: "开启呼吸灯",
        duration: 1000 // 持续展示 toast
      });
    },
    toastBreathLightClose() {
      const toast = Toast.success({
        selector: "#breathLightClose",
        message: "关闭呼吸灯",
        duration: 1000 // 持续展示 toast
      });
    },
    getUserInfo() {
      // 调用登录接口
      wx.login({
        success: () => {
          wx.getUserInfo({
            success: res => {
              this.userInfo = res.userInfo;
            }
          });
        }
      });
    },
    listBLEDevice() {
      console.log("搜寻到的蓝牙有: ", this.allDevices);
    },
    // UI交互事件
    onPopupClose() {
      this.popupShow = false;
    },
    onControlPopupClose() {
      this.controlPopupShow = false;
    },
    closePopup() {
      this.popupShow = false;
    },
    closeControlPopup() {
      this.controlPopupShow = false;
    },
    showBLE() {
      this.popupShow = true;
    },
    showBLEControl() {
      this.controlPopupShow = true;
    },
    // 台灯开关的控制
    onlightStatusChange(e) {
      this.isLightOpen = e.mp.detail;
      let brightnessLabel = this.hexStringToNumber("C");
      if (e.mp.detail) {
        let sendStrArr = [brightnessLabel, 1, 13, 10];
        this.writeBLECharacteristicValue(sendStrArr);
      } else {
        let sendStrArr = [brightnessLabel, 0, 13, 10];
        this.writeBLECharacteristicValue(sendStrArr);
      }
    },
    // 亮度控制
    onLightSliderChange(e) {
      let brightnessLabel = this.hexStringToNumber("A");
      let sendStrArr = [brightnessLabel, e.mp.detail, 13, 10];
      console.log(sendStrArr);
      this.writeBLECharacteristicValue(sendStrArr);
      this.breathLight.isshaking = false
    },
    // 光色控制
    onColorSliderChange(e) {
      let brightColorLabel = this.hexStringToNumber("B");
      let sendStrArr = [brightColorLabel, e.mp.detail, 13, 10];
      console.log(sendStrArr);
      this.writeBLECharacteristicValue(sendStrArr);
      this.breathLight.isshaking = false
    },
    // 呼吸功能控制
    breathHandle() {
      let brightfnLabel = this.hexStringToNumber("AB");
      let breathObj = this.breathLight;
      if (!breathObj.isshaking) {
        breathObj.isshaking = true;
        let sendStrArr = [brightfnLabel, 1, 13, 10];
        this.writeBLECharacteristicValue(sendStrArr);
        this.toastBreathLight();
      } else {
        breathObj.isshaking = false;
        let sendStrArr = [brightfnLabel, 0, 13, 10];
        this.writeBLECharacteristicValue(sendStrArr);
        this.toastBreathLightClose();
      }
    },
    // ==================== 蓝牙搜寻操作 =================
    /**
     *  @description 初始化蓝牙适配器，并准备搜索
     * */
    openBluetoothAdapter: function() {
      wx.openBluetoothAdapter({
        success: res => {
          console.log("openBluetoothAdapter success", res);
          this.startBluetoothDevicesDiscovery(); // 搜寻设备
        },
        fail: res => {
          if (res.errCode === 10001) {
            // 提示检查蓝牙是否可用
            wx.onBluetoothAdapterStateChange(function(res) {
              console.log("onBluetoothAdapterStateChange", res);
              if (res.available) {
                this.startBluetoothDevicesDiscovery(); // 搜寻设备
              }
            });
          }
        }
      });
    },
    /**
     *  @description 开始搜索周围BLE
     * */
    startBluetoothDevicesDiscovery: function() {
      if (this._discoveryStarted) {
        return;
      }
      this._discoveryStarted = true;
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true, // 允许重复上报同一设备
        success: res => {
          console.log("startBluetoothDevicesDiscovery success", res);
          this.onBluetoothDeviceFound();
        }
      });
    },
    /**
     *  @description 监听BLE搜寻结果
     * */
    onBluetoothDeviceFound: function() {
      wx.onBluetoothDeviceFound(res => {
        res.devices.forEach(device => {
          if (!device.name && !device.localName) {
            return;
          }
          const foundDevices = this.allDevices; // 所有找到的device列表
          // 返回的deviceid在现有数组中的索引，没有则返回-1
          const idx = inArray(foundDevices, "deviceId", device.deviceId);
          // const data = {};
          if (idx === -1) {
            // 将新发现的设备device对象写入对象
            let index = foundDevices.length; // 直接使用索引更新不起效
            this.allDevices.splice(index, 1, device);
          } else {
            // 更新之前有的对象值
            this.allDevices.splice(idx, 1, device);
          }
        });
      });
    },
    /**
     *  @description 停止适配器搜索，节省开销
     * */
    stopBluetoothDevicesDiscovery: function() {
      wx.stopBluetoothDevicesDiscovery();
    },
    /**
     *  @description 监听BLE搜寻结果
     * */
    createBLEConnection: function(e) {
      const ds = e.currentTarget.dataset;
      const deviceId = ds.deviceId;
      const name = ds.name;
      wx.createBLEConnection({
        deviceId,
        success: res => {
          let _BLE = this.BLE;
          _BLE.connected = true;
          _BLE.name = name;
          _BLE.deviceId = deviceId;
          this.getBLEDeviceServices(deviceId); // 获取设备服务列表
          console.log("连接蓝牙信息: ", this.BLE);
          this.toastConnect();
          setTimeout(() => {
            this.popupShow = false;
          }, 3000);
        }
      });
      this.stopBluetoothDevicesDiscovery(); // 关闭蓝牙搜寻，节省资源
    },
    /**
     *  @description 获取BLE服务列表fn
     * @param {deviceId: String} BLE设备ID
     * */
    getBLEDeviceServices: function(deviceId) {
      wx.getBLEDeviceServices({
        deviceId,
        success: res => {
          console.log("该设备的服务有： ", res.services);
          for (let i = 0; i < res.services.length; i++) {
            if (res.services[i].isPrimary) {
              // 是否为主服务
              // 获取BLE该服务特征值characteristics
              this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid);
              return;
            }
          }
        }
      });
    },
    /**
     *  @description 获取BLE服务特征值
     *  @param {deviceId: String} BLE设备ID
     *  @param {serviceId: String} BLE设备服务ID
     * */
    getBLEDeviceCharacteristics: function(deviceId, serviceId) {
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: res => {
          console.log(
            "getBLEDeviceCharacteristics success",
            res.characteristics
          );
          // 遍历主服务中的每个特征值
          for (let i = 0; i < res.characteristics.length; i++) {
            let item = res.characteristics[i];
            if (item.properties.read) {
              // 如果可读
              // 读取该特征值的属性信息，在Valchange回调中取得读取的值
              console.log("BLE can read!!!!!");
              wx.readBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId: item.uuid // 特征值的uuid
              });
            }
            // 如果可写
            if (item.properties.write) {
              console.log("BLE can write!!!!!");
              let _BLE = this.BLE;
              _BLE.canWrite = true;
              // 将可写设备的设备id 服务id 特征值id记录，并启动写操作
              _BLE.deviceId = deviceId;
              _BLE.serviceId = serviceId;
              _BLE.characteristicId = item.uuid;
              let testbuffer = [0];
              setTimeout(() => {
                this.writeBLECharacteristicValue(testbuffer);
              }, 2000);
            }
            // 该特征值是否支持通知或者指示
            if (item.properties.notify || item.properties.indicate) {
              wx.notifyBLECharacteristicValueChange({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
                state: true, // 是否启用notify
                success: res => {
                  console.log('notify 启用成功', res)
                }
              });
            }
          }
        },
        fail(res) {
          console.error("getBLEDeviceCharacteristics", res);
        }
      });
      // 操作之前先监听，保证第一时间获取数据
      wx.onBLECharacteristicValueChange(characteristic => {
        console.log('rec', characteristic)
        // let idx = inArray(this.chs, "uuid", characteristic.characteristicId);
        // console.log('bug 在上')
        // if (idx === -1) {
        //   let index = this.chs.length;
        //   var BLECharacteristicVal = {
        //     uuid: characteristic.characteristicId,
        //     value: ab2hex(characteristic.value)
        //   };
        //   this.chs.splice(index, 1, BLECharacteristicVal);
        // } else {
        //   this.chs.splice (idx, 1, BLECharacteristicVal);
        // }
        console.log('value is:', ab2hex(characteristic.value))
      });
    },
    /**
     *  @description 向BLE设备写16进制数据
     *  @param {Array} 要发送的数据 数组
     * */
    writeBLECharacteristicValue: function(val) {
      let bufferLength = val.length;
      let buffer = new ArrayBuffer(bufferLength); // 生成一字节的类型化数组
      let dataView = new DataView(buffer); // 转换成数组视图
      for (let i = 0; i < val.length; i++) {
        dataView.setUint8(i, val[i]); // 写入内存,从第一个字节开始
      }
      wx.writeBLECharacteristicValue({
        deviceId: this.BLE.deviceId,
        serviceId: this.BLE.serviceId,
        characteristicId: this.BLE.characteristicId,
        value: buffer,
        success: res => {
          console.log("写入成功", res);
        }
      });
    },
    /**
     *  @description 关闭蓝牙适配器
     * */
    closeBluetoothAdapter: function() {
      wx.closeBluetoothAdapter();
    },
    /**
     *  @description 关闭当前蓝牙连接
     * */
    closeBLEConnection: function() {
      wx.closeBLEConnection({
        deviceId: this.BLE.deviceId
      });
      let _BLE = this.BLE;
      _BLE.connected = false;
      _BLE.canWrite = false;
      this.chs = [];
    },
    /**
     *  @description str -> hex Arraybuffer
     * */
    hexStringToArrayBuffer(str) {
      if (!str) {
        return new ArrayBuffer(0);
      }
      var buffer = new ArrayBuffer(str.length);
      let dataView = new DataView(buffer);
      let ind = 0;
      for (let i = 0, len = str.length; i < len; i += 2) {
        let code = parseInt(str.substr(i, 2), 16);
        dataView.setUint8(ind, code);
        ind++;
      }
      return buffer;
    },
    /**
     *  @description str -> hex number
     * */
    hexStringToNumber(str) {
      if (!str) {
        return 0;
      }
      let hexnumber = parseInt(str, 16);
      return hexnumber;
    },

    clickHandle(msg, ev) {
      // console.log("clickHandle:", msg, ev);
    }
  },

  // ====== 生命周期钩子函数 ======
  created() {
    // 调用应用实例的方法获取全局数据
    this.getUserInfo();
  }
};
</script>

<style>
.userinfo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.userinfo-avatar {
  width: 128rpx;
  height: 128rpx;
  margin: 20rpx;
  border-radius: 50%;
}

.userinfo-nickname {
  color: #aaa;
}

.usermotto {
  margin-top: 150px;
}

.form-control {
  display: block;
  padding: 0 12px;
  margin-bottom: 5px;
  border: 1px solid #ccc;
}

.counter {
  display: inline-block;
  margin: 10px auto;
  padding: 5px 10px;
  color: blue;
  border: 1px solid blue;
}

.device_list {
  width: 100%;
  height: auto;
  margin-top: 30rpx;
}

.popupRight {
  width: 80% !important;
  height: 100% !important;
  padding: 10px;
}

.popupLeft {
  width: 100% !important;
  height: 100% !important;
  padding: 10px;
}

.disConnectBtn {
  margin: 0 !important;
}

.colHeader {
  width: 100%;
  height: auto;
}

.powerSwitch {
  width: 100%;
  height: auto;
  border-bottom: 1px solid rgb(194, 192, 192);
  margin-bottom: 50rpx;
}

.sliderControl {
  width: 100%;
  height: auto;
  margin-bottom: 50rpx;
}

.slideTitle {
  margin-bottom: 20rpx;
}

.breathLight {
  width: 80%;
  height: 300rpx;
  margin: 10px auto;
}
</style>
