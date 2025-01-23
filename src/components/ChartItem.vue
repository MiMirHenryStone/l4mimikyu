<template>
  <!-- echarts -->
  <div
    class="bg"
    :class="{ 'full-screen': fullScreen, dark: props.theme == 'dark' }"
  >
    <div
      class="button hhl"
      v-if="fullScreen"
      @click="
        fullScreen = false;
        handleResize(true);
      "
    >
      ✖️
    </div>
    <div
      class="button hhl"
      v-else
      @click="
        fullScreen = true;
        handleResize(true);
      "
    >
      🔍
    </div>
    <div class="echarts" ref="charEle"></div>
  </div>
</template>

<script setup lang="ts">
import { ECharts, EChartsOption, init } from "echarts";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
const props = defineProps({
  theme: { type: String, default: "" },
  option: { type: Object, default: () => ({}) },
  yData: { type: Array, required: false },
  events: { type: Object, default: () => ({}) },
  zrEvents: { type: Object, default: () => ({}) },
});
let charEch: ECharts;

const charEle = ref<HTMLElement>();

const initChart = () => {
  setTimeout(() => {
    charEch?.dispose();
    let theme = fullScreen.value ? undefined : props.theme;
    charEch = init(charEle.value, theme, { locale: "ZH" });
    charEch.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        appendTo:
          document.documentElement.querySelector("dialog") ??
          document.documentElement,
        position: (point, params, dom, rect, size) => [
          point[0] > size.viewSize[0] / 2
            ? point[0] - size.contentSize[0] - 4
            : point[0] + 4,
          point[1] + size.contentSize[1] > size.viewSize[1]
            ? Math.max(0, size.viewSize[1] - size.contentSize[1])
            : point[1],
        ],
      },
      grid: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
        containLabel: true,
      },
    });
    charEch.setOption(
      props.yData
        ? {
            xAxis: {
              type: "category",
              boundaryGap: false,
              axisLabel: { show: false },
            },
            yAxis: { type: "value", axisLabel: { show: false } },
            series: props.yData.map((data) => ({
              type: "line",
              data,
              showSymbol: false,
            })),
          }
        : props.option
    );
    for (let key in props.events) {
      charEch.on(key, {}, (params) => props.events[key](params, charEch));
    }
    for (let key in props.zrEvents) {
      (charEch.getZr() as any).on(key, {}, (params) =>
        props.zrEvents[key](params, charEch)
      );
    }
  }, 300);
};

const getOption = () => charEch.getOption();
const setOption = (params, opt) => charEch.setOption(params, opt);
const showTip = (params) => {
  charEch.dispatchAction({
    type: "showTip",
    ...params,
  });
};
const hideTip = () => charEch.dispatchAction({ type: "hideTip" });

watch(() => (props.yData ? props.yData : props.option), initChart, {
  deep: true,
});

const rem = ref(0);
const handleResize = (deep: boolean = false) => {
  setTimeout(() => {
    rem.value = Number(
      document.documentElement.style.fontSize.match(/[0-9\.]+/)?.[0]
    );
    nextTick(() => (deep ? initChart() : charEch?.resize()));
  }, 300);
};
handleResize();

const route = useRoute();
watch(
  () => route,
  () => {
    setTimeout(() => {
      initChart();
    }, 600);
  },
  { deep: true }
);

const fullScreen = ref(false);

onMounted(() => {
  initChart();
  window.addEventListener("resize", () => handleResize());
});

onBeforeUnmount(() => {
  charEch?.dispose();
  window.removeEventListener("resize", () => handleResize());
});

defineExpose({ getOption, setOption, showTip, hideTip });
</script>
<style lang="scss" scoped>
.bg {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.echarts {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.button {
  position: absolute;
  top: 0.25em;
  left: 0.25em;
  z-index: 1;
  cursor: pointer;
  font-size: 0.8rem;
  color: #ccc;
}
.bg.full-screen {
  z-index: 10000;
  position: fixed;
  margin: 1rem;
  width: calc(100% - 2rem);
  height: calc(100% - 2rem);
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  box-sizing: border-box;
  background: white;
  .button {
    font-size: 1.5rem;
  }
  // &.dark {
  //   background: black;
  // }
}
</style>
