<template>
  <view class="container">
    <view class="prices">
      <view :key="i" v-for="(item,i) in priceTypes" class="price-type">
        <view class="price-type-color" :style="{backgroundColor:item.color}"></view>
        <text class="price-type-price">¥{{item.price}}</text>
      </view>
    </view>
    <view class="sites">
		 <web-view :webview-styles="webviewStyles" src="http://172.16.172.51:1234/"></web-view>
      <!-- <canvas style="width: 100%; height: 100%; background-color: #007AFF;" canvas-id="siteCanvas" id="siteCanvas"></canvas> -->
    </view>
    <view class="selected-sites">
      <view :key="i" v-for="(item,i) in selectedSites" class="selected-site">
        <view class="selected-site-color" :style="{backgroundColor:item.color}"></view>
        <text class="selected-site-text">¥{{item.text}}</text>
        <image mode="aspectFit" @click="clickClose(i)" class="selected-site-close" src="../../static/close.png"></image>
      </view>
    </view>

    <view class="bottom">
      <view class="total">
        <text class="total-price">¥{{totalPrice}}</text>
        <text class="total-desc">已省{{leave}}元</text>
      </view>
      <view class="total-detail">
        <text class="total-detail-text">价格明细</text>
      </view>
      <view class="confirm-button" @click="handleOK()">确认选座</view>
    </view>
  </view>
</template>

<script>
  import {
    getReward,
    addAddress
  } from '@/utils/request.js';
  import {
	  dateFormat
  } from '@/utils/tool.js';

  export default {
    data() {
      return {
        totalPrice: 300,
        leave: 290,
        priceTypes: [{
            color: "#A68F4F",
            price: "180",
            type: 1,
          },
          {
            color: "#2AC5FF",
            price: "280",
            type: 1,
          },
          {
            color: "#A7571B",
            price: "380",
            type: 1,
          }, {
            color: "#F68F08",
            price: "480",
            type: 1,
          },
          {
            color: "#00AE5C",
            price: "580",
            type: 1,
          }
        ],
        selectedSites: [{
            color: "#A68F4F",
            text: "3排6号",
            type: 1,
          },
          {
            color: "#2AC5FF",
            text: "3排7号",
            type: 1,
          }
        ]
      }
    },
    created() {
		console.log('created');
		console.log(dateFormat);
		console.log(uni);
		
    },
    onReady() {
		console.log('onReady');
    },
    methods: {
      clickClose(i){
		  console.log(i);
        this.selectedSites.splice(i,1);
      },
	  handleOK(){
		console.log('ok');
		console.log(uni);
		 var context = uni.createCanvasContext('siteCanvas')
		        context.setStrokeStyle("#00ff00")
		        context.setLineWidth(5)
		        context.rect(0, 0, 200, 200)
		        context.stroke()
		        context.setStrokeStyle("#ff0000");
		        context.setLineWidth(2)
		        context.moveTo(160, 100)
		        context.arc(100, 100, 60, 0, 2 * Math.PI, true)
		        context.moveTo(140, 100)
		        context.arc(100, 100, 40, 0, Math.PI, false)
		        context.moveTo(85, 80)
		        context.arc(80, 80, 5, 0, 2 * Math.PI, true)
		        context.moveTo(125, 80)
		        context.arc(120, 80, 5, 0, 2 * Math.PI, true)
		        context.stroke()
		        context.draw();
	  }
    }
  }
</script>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;

    .prices {
      display: flex;
      flex-direction: row;
      background-color: #FFFFFF;
      padding: 10px;
      overflow: auto;
      width: 100%;
      flex-wrap: nowrap;

      .price-type {
        background: #F5F5F5;
        opacity: 1;
        border-radius: 78px;
        padding: 10px 15px;
        margin: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;

        .price-type-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
        }

        .price-type-price {
          margin-left: 10px;
          line-height: 17px;
          color: #666666;
        }
      }
    }

    .sites {
      flex: 1;
      background-color: #F5F5F5;
    }

    .selected-sites {
      display: flex;
      flex-direction: row;
      background-color: #FFFFFF;
      padding: 10px;
      overflow: auto;
      width: 100%;
      flex-wrap: nowrap;
      height: 60px;
      .selected-site {
        background: #F5F5F5;
        opacity: 1;
        border-radius: 78px;
        padding: 10px 15px;
        margin: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;

        .selected-site-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .selected-site-text {
          margin-left: 10px;
          line-height: 17px;
          color: #666666;
        }

        .selected-site-close {
          margin-left: 10px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .bottom {
      display: flex;
      flex-direction: row;
      padding: 10px 10px 30px 10px;
      height: 70px;
      .total {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        .total-price {
          color: #FF4E00;
          font-size: 25px;
          font-weight: bold;
          line-height: 50px;
        }

        .total-desc {
          font-size: 12px;
          color: #999999;
        }
      }

      .total-detail {
        margin-left: 10px;
        flex: 1;
        .total-detail-text {
          font-size: 12px;
          color: #999999;
          line-height: 50px;
        }
      }

      .confirm-button {
        width: 110px;
        height: 43px;
        background: #FF4E00;
        opacity: 1;
        border-radius: 22px;
        text-align: center;
        color: #FFFFFF;
        line-height: 43px;
      }
    }

  }
</style>
