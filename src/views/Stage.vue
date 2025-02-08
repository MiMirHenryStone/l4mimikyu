<template>
  <div>
    <template v-if="!ing || auto">
      <h2>
        DECK
        <button @click="deck = sortCardList(deck)">⇅</button>
      </h2>
      <hr />
      <div class="grid">
        <card-item
          v-for="(c, i) in deck"
          :card="c"
          :close="true"
          @click="deck.splice(i, 1)"
          :pointer-events="ing ? 'none' : 'auto'"
        ></card-item>
      </div>
      <details :open="detailsOpen">
        <summary>
          CARD
          <hr />
        </summary>
        <div class="grid">
          <card-item
            v-for="(c, i) in cards"
            :card="c"
            @click="deck.push(new Card(c.short))"
            :pointer-events="ing ? 'none' : 'auto'"
          ></card-item>
        </div>
      </details>
    </template>

    <form>
      <h2>STAGE</h2>
      <hr />
      <div style="font-size: small">
        <label for="qc">曲长: </label>
        <input v-model="formData.qc" type="text" :disabled="ing" id="qc" />
        s&nbsp;
        <label for="qc">生化值: </label>
        <input v-model="formData.sh" type="text" :disabled="ing" id="sh" />
        &nbsp;
        <label for="deckLength">卡组牌数: </label>
        <input
          v-model="formData.deckLength"
          type="number"
          :disabled="ing"
          id="deckLength"
        />
        &nbsp;
        <button
          @click="
            formData.apSpeed = Number(
              (
                (1200 / formData.qc / formData.sh) *
                (1 - 0.1 * Math.min(9, 18 - formData.deckLength))
              ).toFixed(2)
            );
            formData.cardTimes = Math.floor(
              ((formData.qc * formData.sh) / 5) * (routeQuery.section ? 1 : 4)
            );
          "
          :disabled="ing"
        >
          计算AP回复速度/暂停回数
        </button>
      </div>
      <div>
        <label for="ap">AP回复速度: </label>
        <input v-model="formData.apSpeed" type="text" :disabled="ing" id="ap" />
      </div>
      <div>
        <label for="card-time">暂停回数: </label>
        <input
          v-model="formData.cardTimes"
          :disabled="ing"
          type="number"
          id="card-time"
        />
      </div>
      <div>
        <label for="ap-max">最大AP: </label>
        <input
          v-model="formData.apMax"
          :disabled="ing"
          type="number"
          id="ap-max"
        />
      </div>
      <div>
        <label for="sp">SP: </label>
        <select
          v-model="formData.sp"
          :disabled="ing"
          id="sp"
          @change="
            formData.sp.includes('2')
              ? (formData.strategy = 'score')
              : (formData.strategy = 'cost')
          "
        >
          <option value="">--</option>
          <option value="tz">舞会缀</option>
          <option value="sy">舞会沙耶</option>
          <!-- <option value="kz2">银河梢</option> -->
          <option value="tz2">银河缀</option>
          <option value="mg2">银河慈</option>
        </select>
      </div>
      <div>
        <label for="effect">效果: </label>
        <select v-model="formData.effect" :disabled="ing" id="effect">
          <option value="">--</option>
          <option value="kj2a">
            (2025/02 个人战A) skill3回使用 手札全捨 山札手札上限引直
          </option>
          <option value="kj2b">
            (2025/02 个人战B) skill10回使用 deck全card消费AP-1
          </option>
          <option value="kj2c">(2025/02 个人战C) skill1回使用 AP1回复</option>
          <option value="st1a">
            (2025/01 公会战A) skill6回使用 deck全card消费AP+1
          </option>
          <option value="kj1a">
            (2025/01 个人战A) 山札切 AP3回复
            main效果reshuffle效果deck全card消费AP+1
          </option>
          <option value="kj1b">
            (2025/01 个人战B) skill5回使用 手札全捨 山札手札上限引直
          </option>
          <option value="gc1a">
            (2025/01 GC A) skill30回使用
            main效果mental回复deck全card消费APstage中常-1
          </option>
          <option value="gc1b">
            (2025/01 GC B) skill15回使用 deck全スリブcard消费APstage中常-1
          </option>
          <option value="gc1c">
            (2025/01 GC C) skill20回使用 deck全ドルケcard消费APstage中常-1
          </option>
        </select>
      </div>
      <div v-if="routeQuery.section != 1">
        <label for="strategy">策略: </label>
        <select v-model="formData.strategy" :disabled="ing" id="strategy">
          <option value="cost">LOVE/AP优先</option>
          <option value="score">LOVE优先</option>
          <!-- <option value="exCost">AP优先</option> -->
        </select>
      </div>
      <div>
        <label for="jewelry" v-if="routeQuery.section == 1">
          LIVE TARGET👗:
        </label>
        <label for="jewelry" v-else>LIVE TARGET💎: </label>
        <input
          v-model="formData.jewelryCountTarget"
          type="number"
          id="jewelry"
          @change="
            if (ing && !auto) {
              stage.jewelryCountTarget = formData.jewelryCountTarget;
              if (stage.section != 1) stage.testAllCards();
              refreshOsusume();
            }
          "
        />
      </div>
      <div>
        <label for="jewelry" v-if="routeQuery.section == 1">
          SKIP TARGET👗:
        </label>
        <label for="jewelry" v-else>SKIP TARGET💎: </label>
        <input
          v-model="formData.jewelryCountTargetMin"
          :disabled="ing"
          type="number"
          id="jewelry"
        />
        ~
        <input
          v-model="formData.jewelryCountTargetMax"
          :disabled="ing"
          type="number"
          id="jewelry"
        />
      </div>
      <div>
        <label for="skip-time">SKIP回数: </label>
        <input
          v-model="formData.skipTimes"
          :disabled="ing"
          type="number"
          id="skip-time"
        />
      </div>
    </form>

    <div style="text-align: right">
      <button
        v-if="ing && !auto"
        @click="
          dialogData = {
            key: stage.jewelryCountTarget,
            score: stage.strategy == 'heartMax' ? stage.heartMax : stage.score,
            cardTimesDict: stage.cardTimesDict,
            yData: [stage.yData],
          };
          nextTick(() => dialog.showModal());
        "
      >
        LOG
      </button>
      <button v-if="ing" @click="retire">RETIRE</button>
      <template v-else>
        <button v-if="autoResults.length" @click="autoResults = []">
          CLEAR RESULTS
        </button>
        <button @click="start(true)">SKIP</button>
        <button @click="start(false)">LIVE START</button>
      </template>
    </div>

    <template v-if="ing && !auto">
      <h2 class="flex-between">
        <div>
          {{ stage.score }}
        </div>
        <div>{{ stage.timesCount }}回</div>
      </h2>
      <h2 class="flex-between">
        <div style="width: 25%">
          {{ stage.sp == "mg2" ? "∞" : stage.mental ? "100%" : "-%" }}
        </div>
        <div style="text-align: center">♥×{{ stage.heartMax }}</div>
        <div style="width: 25%; text-align: right">
          {{ stage.ignition ? "🔥" : "🚫" }}
          {{ stage.sp == "kz2" ? "∞" : stage.ap }}
        </div>
      </h2>
      <div style="text-align: right"></div>
      <h2 class="flex-between">
        <div>手札 {{ stage.te.length }}</div>
        <button
          @click="
            stage.useCard(undefined);
            refreshOsusume();
          "
        >
          AP SKIP
        </button>
      </h2>
      <hr />
      <div class="grid">
        <card-item
          v-for="(c, i) in stage.te"
          :card="c"
          :stage="stage"
          :te="true"
          :class="{ highlight: osusume == i }"
          @click="
            stage.useCard(i);
            refreshOsusume();
          "
        ></card-item>
      </div>
      <h2>捨札 {{ stage.sute.length }}</h2>
      <hr />
      <div class="grid">
        <card-item
          v-for="(c, i) in stage.sute"
          :card="c"
          :stage="stage"
          pointer-events="none"
        ></card-item>
      </div>
      <h2>山札 {{ stage.yama.length }}</h2>
      <hr />
      <div class="grid">
        <card-item
          v-for="(c, i) in stage.yama"
          :card="c"
          :stage="stage"
          pointer-events="none"
        ></card-item>
      </div>
    </template>
    <template v-else>
      <table v-for="(autoResult, index) in autoResults">
        <thead>
          <tr>
            <td colspan="6">{{ autoResult.deck }}</td>
          </tr>
          <tr>
            <td colspan="2">AP回复速度: {{ autoResult.formData.apSpeed }}</td>
            <td colspan="2">暂停回数: {{ autoResult.formData.cardTimes }}</td>
            <td colspan="2">SKIP回数: {{ autoResult.formData.skipTimes }}</td>
          </tr>
          <tr>
            <td colspan="2">SP: {{ autoResult.formData.sp }}</td>
            <td colspan="2">效果: {{ autoResult.formData.effect }}</td>
            <td colspan="2">策略: {{ autoResult.formData.strategy }}</td>
          </tr>
          <tr>
            <td>target<br />{{ stage.targetCard1 }}</td>
            <td>{{ stage.targetCard0 }}<br />回数</td>
            <td>{{ stage.targetCard1 }}<br />回数</td>
            <td>AP SKIP<br />回数</td>
            <td>heart</td>
            <td>%</td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, key) in autoResult.dict"
            style="cursor: pointer"
            @click="
              dialogData = { key, ...item };
              nextTick(() => dialog.showModal());
            "
          >
            <td>{{ key }}</td>
            <!-- <td>{{ item.jewelryCount }}</td> -->
            <td>
              {{ item.cardTimesDict[autoResult.formData.targetCard0] ?? 0 }}
            </td>
            <td>
              {{ item.cardTimesDict[autoResult.formData.targetCard1] ?? 0 }}
            </td>
            <td>{{ item.cardTimesDict.apSkip }}</td>
            <td>{{ item.score }}</td>
            <td>
              {{
                Number(
                  (
                    (item.score /
                      Math.max(
                        ...Object.values(autoResult.dict).map((i) => i.score)
                      )) *
                    100
                  ).toFixed(2)
                )
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    <dialog v-if="dialogData" ref="dialog">
      <div style="overflow: auto; max-height: calc(100vh - 4em)">
        <div style="height: 25vmin" v-if="dialogData?.yData">
          <ChartItem :y-data="dialogData.yData"></ChartItem>
        </div>
        <table>
          <thead>
            <tr>
              <td>target💎</td>
              <td>{{ dialogData.key }}</td>
            </tr>
            <tr>
              <td>heart</td>
              <td>{{ dialogData.score }}</td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in dialogData.cardTimesDict">
              <td>{{ key }}</td>
              <td>{{ value }}回</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: center">
                <button @click="dialogData = undefined">关闭</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import Stage from "@/js/Stage";
import Card, { cardList } from "@/js/Card";
import CardItem from "@/components/Card.vue";
import { strategyPlay } from "@/js/Strategy";
import ChartItem from "@/components/ChartItem.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const routeQuery = ref(route.query);

const ing = ref(false);
const auto = ref(false);
const autoResults = ref([]);

const detailsOpen = ref(false);

const dialog = ref();
const dialogData = ref();

const formData = ref({
  qc: 104,
  sh: 3.3,
  deckLength: 17,
  apSpeed: 3.15,
  apMax: 20,
  sp: "",
  effect: "",
  jewelryCountTargetMin: 0,
  jewelryCountTargetMax: 16,
  cardTimes: 68,
  skipTimes: 36,
  jewelryCountTarget: 0,
});

let localFormData = localStorage.getItem("formData");
try {
  if (localFormData)
    formData.value = { ...formData.value, ...JSON.parse(localFormData) };
} catch (error) {}

const sortCardList = (cardList) => {
  return cardList
    .slice()
    .sort((a, b) => {
      if (typeof a.member == "number" && typeof b.member == "number")
        return a.member - b.member;
      if (typeof a.member == "number" && typeof b.member != "number") return -1;
      if (typeof a.member != "number" && typeof b.member == "number") return 1;
      return a.member > b.member ? 1 : a.member < b.member ? -1 : 0;
    })
    .sort((a, b) => {
      if (a.year && b.year) return b.year - a.year;
      if (a.year && !b.year) return -1;
      if (!a.year && b.year) return 1;
      return 0;
    });
};

const cards = sortCardList(cardList.map((i) => new Card(i.short)));

const deck = ref([]);

let localDeck = localStorage.getItem("deck");
try {
  if (localDeck) deck.value = JSON.parse(localDeck).map((i) => new Card(i));
} catch (error) {}
if (!deck.value.length)
  deck.value = cardList
    .filter((i) => typeof i.member == "number")
    .map((i) => new Card(i.short))
    .slice(0, 16);

const stage = ref();

window.getStage = () => stage.value;

const newStage = () => {
  stage.value = new Stage([]);
  stage.value.apSpeed = Number(formData.value.apSpeed);
  stage.value.apMax = Number(formData.value.apMax);
  stage.value.sp = formData.value.sp;
  stage.value.effect = formData.value.effect;
  stage.value.strategy = formData.value.strategy;
  stage.value.yama = deck.value.map((i) => new Card(i.short));
  stage.value.section = routeQuery.value.section;

  stage.value.strategy = routeQuery.value.section == 1 ? "heartMax" : "cost";
  stage.value.targetCard0 =
    routeQuery.value.section == 1 ? "蓝远花帆" : "kol慈";
  stage.value.targetCard1 = routeQuery.value.section == 1 ? "蓝远花帆👗" : "💎";
};
newStage();

const retire = () => {
  ing.value = false;
  newStage();
};

const start = async (a) => {
  localStorage.setItem("formData", JSON.stringify(formData.value));
  localStorage.setItem("deck", JSON.stringify(deck.value.map((i) => i.short)));
  detailsOpen.value = false;
  ing.value = true;
  auto.value = a;
  if (a) {
    autoResults.value.push({
      deck: deck.value.map((c) => c.short).join(", "),
      formData: { ...formData.value },
      dict: {},
    });
    for (
      let j = Number(formData.value.jewelryCountTargetMin);
      j <= Number(formData.value.jewelryCountTargetMax);
      j++
    ) {
      if (!ing.value) break;
      let score = 0;
      let yData = [];
      let jewelryCount = 0;
      let cardTimesDict = { apSkip: 0 };
      for (let c of deck.value) cardTimesDict[c.short] = 0;
      for (let s = 0; s < Number(formData.value.skipTimes); s++) {
        await sleep();
        newStage();
        stage.value.jewelryCountTarget = j;
        stage.value.start();
        for (let k = 0; k < Number(formData.value.cardTimes); k++) {
          if (!ing.value) break;
          stage.value.useCard(strategyPlay(stage.value, j));
        }
        if (!ing.value) break;
        score +=
          stage.value.strategy == "heartMax"
            ? stage.value.heartMax
            : stage.value.score;
        yData.push(stage.value.yData);
        jewelryCount += stage.value
          .getAllCards()
          .filter((i) => i.short == stage.value.targetCard1)?.length;
        for (let key in stage.value.cardTimesDict) {
          if (!cardTimesDict[key]) cardTimesDict[key] = 0;
          cardTimesDict[key] += stage.value.cardTimesDict[key];
        }
      }
      if (!ing.value) break;
      for (let key in cardTimesDict)
        cardTimesDict[key] = Number(
          (cardTimesDict[key] / formData.value.skipTimes).toFixed(2)
        );
      autoResults.value.at(-1).dict[j] = {
        score: Number((score / formData.value.skipTimes).toFixed(2)),
        yData,
        jewelryCount: Number(
          (jewelryCount / formData.value.skipTimes).toFixed(2)
        ),
        cardTimesDict,
      };
    }
    ing.value = false;
  } else {
    newStage();
    stage.value.jewelryCountTarget = formData.value.jewelryCountTarget;
    stage.value.start();

    refreshOsusume();
  }
};

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const osusume = ref(-1);
const refreshOsusume = () => {
  osusume.value = strategyPlay(stage.value, formData.value.jewelryCountTarget);
};
</script>

<style lang="scss" scoped>
.highlight {
  box-shadow: cyan 0 0 2px 2px;
}
table {
  width: 100%;
  table-layout: fixed;
  border-spacing: 0;
  font-size: small;
  thead {
    font-weight: bold;
  }
  tbody tr {
    &:nth-child(2n + 1) {
      background: #aaaaaa55;
    }
    &:hover {
      background: #aaaaaaaa;
    }
  }
  td {
    padding: 0.25em;
  }
}
h2 {
  margin-bottom: 0;
  button {
    margin: 0;
    vertical-align: middle;
  }
}
summary {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0.83em;
  cursor: pointer;
}
form > div {
  margin: 0.5em 0;
}
select,
input {
  padding: 0.25em;
  max-width: 100%;
}
input[type="number"],
input[type="text"] {
  width: 3em;
}
button {
  padding: 0.5em;
  margin: 0.25em 0;
  & + button {
    margin-left: 1em;
  }
}
.grid {
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5%, 5em));
  justify-content: space-between;
  // padding: 0.5em;
  // row-gap: 0.5em;
  // column-gap: 0.5em;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
dialog {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 50%;
  margin: auto;
  &::backdrop {
    position: fixed;
    inset: 0px;
    background: #555555aa;
  }
}
</style>
