<template>
  <div>
    <template v-if="!ing || auto">
      <h2>DECK</h2>
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
        <button
          @click="
            formData.apSpeed = Number(
              (1200 / formData.qc / formData.sh).toFixed(2)
            );
            formData.cardTimes = Math.floor((formData.qc * 8) / 3);
          "
          :disabled="ing"
        >
          计算AP回复速度/CARD回数
        </button>
      </div>
      <div>
        <label for="ap">AP回复速度: </label>
        <input v-model="formData.apSpeed" type="text" :disabled="ing" id="ap" />
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
          <option value="st1a">
            (2025年1月公会战A) skill6回使用 deck全card消费AP+1
          </option>
          <option value="kj1a">
            (2025年1月个人战A) 山札切
            <!-- AP3回复 -->
            main效果reshuffle效果deck全card消费AP+1
          </option>
          <option value="kj1b">
            (2025年1月个人战B) skill5回使用 手札全捨 山札手札上限引直
          </option>
        </select>
      </div>
      <div>
        <label for="jewelry">TARGET💎: </label>
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
        /
        <input
          v-model="jewelryCountTarget"
          type="number"
          id="jewelry"
          @change="if (ing && !auto) refreshOsusume();"
        />
      </div>
      <div>
        <label for="card-time">CARD回数: </label>
        <input
          v-model="formData.cardTimes"
          :disabled="ing"
          type="number"
          id="card-time"
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
      <div>
        <label for="strategy">策略: </label>
        <select v-model="formData.strategy" :disabled="ing" id="strategy">
          <option value="cost">pt/AP优先</option>
          <option value="score">pt优先</option>
          <option value="exCost">AP优先</option>
        </select>
      </div>
    </form>

    <div style="text-align: right">
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
        <div>
          {{ stage.sp == "mg2" ? "∞" : stage.mental ? "100%" : "-%" }}
        </div>
        <div>
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
      <table v-for="(autoResult, index) in autoResults" style="width: 100%">
        <thead>
          <tr>
            <td colspan="6">{{ autoResult.deck }}</td>
          </tr>
          <tr>
            <td colspan="3">AP回复速度: {{ autoResult.formData.apSpeed }}</td>
            <td colspan="3">
              SP: {{ autoResult.formData.sp }}, 效果:
              {{ autoResult.formData.effect }}
            </td>
          </tr>
          <tr>
            <td colspan="3">CARD回数: {{ autoResult.formData.cardTimes }}</td>
            <td colspan="3">SKIP回数: {{ autoResult.formData.skipTimes }}</td>
          </tr>
          <tr>
            <td>target<br />💎</td>
            <!-- <td>actual<br />💎</td> -->
            <td>kol慈<br />回数</td>
            <td>💎<br />回数</td>
            <td>AP SKIP<br />回数</td>
            <td>pt</td>
            <td>%</td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, key) in autoResult.dict">
            <td>{{ key }}</td>
            <!-- <td>{{ item.jewelryCount }}</td> -->
            <td>{{ item.kt }}</td>
            <td>{{ item.jt }}</td>
            <td>{{ item.st }}</td>
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
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import Stage from "@/js/Stage";
import Card, { cardList } from "@/js/Card";
import CardItem from "@/components/Card.vue";
import { strategyPlay } from "@/js/Strategy";

const ing = ref(false);
const auto = ref(false);
const autoResults = ref([]);

const detailsOpen = ref(false);

const formData = ref({
  qc: 140,
  sh: 3.3,
  apSpeed: 2.6,
  sp: "",
  effect: "",
  jewelryCountTargetMin: 0,
  jewelryCountTargetMax: 20,
  cardTimes: 373,
  skipTimes: 36,
  strategy: "cost",
});
const jewelryCountTarget = ref(10);

const cards = cardList
  .map((i) => new Card(i.short))
  .sort((a, b) => {
    if (typeof a.member == "number" && typeof b.member == "number")
      return a.member - b.member;
    if (typeof a.member == "number" && typeof b.member != "number") return -1;
    if (typeof a.member != "number" && typeof b.member == "number") return 1;
    return a.member > b.member ? 1 : a.member < b.member ? -1 : 0;
  });

const deck = ref(
  cardList
    .filter((i) => typeof i.member == "number")
    .map((i) => new Card(i.short))
    .slice(0, 16)
);

const stage = ref();

window.getStage = () => stage.value;

const newStage = () => {
  stage.value = new Stage([]);
  stage.value.apSpeed = Number(formData.value.apSpeed);
  stage.value.sp = formData.value.sp;
  stage.value.effect = formData.value.effect;
  stage.value.strategy = formData.value.strategy;
  stage.value.yama = deck.value.map((i) => new Card(i.short));
};
newStage();

const retire = () => {
  ing.value = false;
  newStage();
};

const start = async (a) => {
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
      let jewelryCount = 0;
      let kt = 0;
      let jt = 0;
      let st = 0;
      for (let s = 0; s < Number(formData.value.skipTimes); s++) {
        await sleep();
        newStage();
        stage.value.start();
        for (let k = 0; k < Number(formData.value.cardTimes); k++) {
          if (!ing.value) break;
          stage.value.useCard(strategyPlay(stage.value, j));
        }
        if (!ing.value) break;
        score += stage.value.score;
        jewelryCount += stage.value
          .getAllCards()
          .filter((i) => i.member == "jewelry")?.length;
        kt += stage.value.timesDict.kol慈;
        jt += stage.value.timesDict["💎"];
        st += stage.value.timesDict.apSkip;
      }
      autoResults.value.at(-1).dict[j] = {
        score: Number((score / formData.value.skipTimes).toFixed(2)),
        jewelryCount: Number(
          (jewelryCount / formData.value.skipTimes).toFixed(2)
        ),
        kt: Number((kt / formData.value.skipTimes).toFixed(2)),
        jt: Number((jt / formData.value.skipTimes).toFixed(2)),
        st: Number((st / formData.value.skipTimes).toFixed(2)),
      };
      if (!ing.value) break;
    }
    ing.value = false;
  } else {
    newStage();
    stage.value.start();

    refreshOsusume();
  }
};

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const osusume = ref(-1);
const refreshOsusume = () => {
  osusume.value = strategyPlay(stage.value, jewelryCountTarget.value);
};
</script>

<style lang="scss" scoped>
.highlight {
  box-shadow: cyan 0 0 2px 2px;
}
table {
  table-layout: fixed;
  border-spacing: 0;
  font-size: small;
  thead {
    font-weight: bold;
  }
  tbody tr:nth-child(2n + 1) {
    background: #aaaaaa55;
  }
  td {
    padding: 0.25em;
  }
}
h2 {
  margin-bottom: 0;
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
</style>
