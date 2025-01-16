<template>
  <div
    class="card"
    :style="{
      pointerEvents:
        te &&
        props.card.getCost(te ? props.stage.te : undefined) > props.stage.ap
          ? 'none'
          : props.pointerEvents,
    }"
  >
    <div
      class="background"
      :style="{
        backgroundColor: memberColorDict[props.card.member]
          ? `${memberColorDict[props.card.member]}`
          : 'transparent',
      }"
    ></div>
    <div
      :style="{
        fontWeight: props.card.isReshuffle(props.stage) ? 'bold' : '',
        fontStyle: props.card.isReshuffle(props.stage) ? 'italic' : '',
      }"
    >
      {{ props.card.short }}
    </div>
    <div class="cost">
      {{ props.card.getCost(te ? props.stage.te : undefined) }}
    </div>
    <div
      class="main"
      :style="{
        backgroundColor: cardColorDict[props.card.getMain(props.stage)],
      }"
    ></div>
    <div v-if="props.close" class="close">×</div>
    <div v-if="props.te" class="test">
      {{
        Number(
          props.stage.testResults[props.stage.te.indexOf(props.card)].toFixed(2)
        )
      }}
    </div>
    <div
      v-if="props.stage?.timesDict[props.card.short] != undefined"
      class="time"
    >
      {{ props.stage?.timesDict[props.card.short] }}
    </div>
  </div>
</template>

<script setup>
import Card from "@/js/Card";
import Stage from "@/js/Stage";
const props = defineProps({
  card: { type: Card },
  stage: { type: Stage },
  te: { default: false },
  close: { default: false },
  pointerEvents: { default: "auto" },
});

const cardColorDict = {
  heart: "rgb(204,39,39)",
  "love+": "rgb(174,141,24)",
  voltage: "rgb(174,141,24)",
  mental: "rgb(48,124,24)",
  reshuffle: "rgb(134,82,195)",
  teMax: "rgb(134,82,195)",
  protect: "rgb(48,124,24)",
  dress: "rgb(134,82,195)",
  ap: "rgb(174,141,24)",
  "ap-": "rgb(134,82,195)",
  "": "transparent",
};
const memberColorDict = {
  1: "#f8b500",
  2: "#5383c3",
  3: "#68be8d",
  4: "#ba2636",
  5: "#e7609e",
  6: "#c8c2c6",
  7: "#a2d7dd",
  8: "#fad764",
  9: "#9d8de2",
  bubble: "#555555",
  jewelry: "#555555",
};
</script>

<style lang="scss" scoped>
.card {
  box-sizing: border-box;
  border: 1px solid #383834;
  color: #383834;
  border-radius: 0.25em;
  padding: 2em 0;
  white-space: pre;
  text-align: center;
  font-size: 1em;
  position: relative;
  margin: 0.25em;
  cursor: pointer;
  .background {
    z-index: -1;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    opacity: 0.5;
  }

  .main {
    position: absolute;
    width: calc(1em - 2px);
    height: calc(1em - 2px);
    border-radius: 1em;
    border: 1px solid #383834;
    box-shadow: inset 0 0 0 1px white;
    box-sizing: border-box;
    top: 1em;
    left: 1px;
  }
  .cost {
    position: absolute;
    height: 1em;
    line-height: 1em;
    top: 0;
    left: 0;
  }
  .close {
    position: absolute;
    width: 1em;
    height: 1em;
    line-height: 1em;
    top: 0;
    right: 0;
  }
  .time {
    position: absolute;
    height: 1em;
    line-height: 1em;
    bottom: 0;
    right: 0;
  }
  .test {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }

  &:hover {
    .background {
      opacity: 1;
    }
    .close {
      font-size: 1.5em;
    }
  }
}
</style>
