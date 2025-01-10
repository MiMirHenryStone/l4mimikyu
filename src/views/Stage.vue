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
      <div>
        <label for="sp">SP: </label>
        <select v-model="formData.sp" :disabled="ing" id="sp">
          <option value="">--</option>
          <option value="td">舞会缀</option>
          <option value="sy">舞会沙耶</option>
          <option value="mg2">银河慈</option>
        </select>
      </div>
      <div>
        <input
          v-model="formData.effects.a"
          :disabled="ing"
          type="checkbox"
          id="104-3-3-1-a"
        />
        <label for="104-3-3-1-a">
          山札切
          <!-- AP3回复 -->
          main效果reshuffle效果deck全card消费AP+1
        </label>
      </div>
      <div>
        <input
          v-model="formData.effects.b"
          :disabled="ing"
          type="checkbox"
          id="104-3-3-1-b"
        />
        <label for="104-3-3-1-b">
          skill5回使用 手札全捨 山札手札上限引直
        </label>
      </div>
      <div>
        <label for="jewelry">TARGET JEWELRY: </label>
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
      <h2>
        {{ stage.score }}
        <div style="float: right">{{ stage.timesCount }}回</div>
      </h2>
      <h2>
        {{ stage.mental ? "100%" : "-%" }}
        <div style="float: right">{{ stage.ignition ? "🔥" : "🚫" }}</div>
      </h2>

      <h2>手札 {{ stage.te.length }}</h2>
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
            <td colspan="3">SP: {{ autoResult.formData.sp }}</td>
            <td colspan="3">
              效果:
              {{
                Object.keys(autoResult.formData.effects)
                  .filter((key) => autoResult.formData.effects[key])
                  .map((key) => key)
                  .join(", ")
              }}
            </td>
          </tr>
          <tr>
            <td colspan="3">CARD回数: {{ autoResult.formData.cardTimes }}</td>
            <td colspan="3">SKIP回数: {{ autoResult.formData.skipTimes }}</td>
          </tr>
          <tr>
            <td>target<br />💎</td>
            <td>actual<br />💎</td>
            <td>kol慈<br />回数</td>
            <td>💎<br />回数</td>
            <td>pt</td>
            <td>%</td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, key) in autoResult.dict">
            <td>{{ key }}</td>
            <td>{{ item.jewelryCount }}</td>
            <td>{{ item.kt }}</td>
            <td>{{ item.jt }}</td>
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
  sp: "",
  effects: {},
  jewelryCountTargetMin: 0,
  jewelryCountTargetMax: 20,
  cardTimes: 360,
  skipTimes: 36,
});
const jewelryCountTarget = ref(10);

const cards = cardList.map((i) => new Card(i.short));

const deck = ref(
  cardList
    .filter((i) => typeof i.member == "number")
    .map((i) => new Card(i.short))
    .slice(0, 16)
);

const stage = ref();
const newStage = () => {
  stage.value = new Stage([]);
  stage.value.sp = formData.value.sp;
  stage.value.effects = formData.value.effects;
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
      formData: { ...formData.value, effects: { ...formData.value.effects } },
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
      for (let s = 0; s < Number(formData.value.skipTimes); s++) {
        await sleep();
        newStage();
        stage.value.start();
        for (let k = 0; k < Number(formData.value.cardTimes); k++) {
          if (!ing.value) break;
          stage.value.useCard(
            strategyPlay(
              stage.value,
              j,
              stage.value.sp == "mg2" ? "score" : "cost"
            )
          );
        }
        if (!ing.value) break;
        score += stage.value.score;
        jewelryCount += stage.value
          .getAllCards()
          .filter((i) => i.member == "jewelry")?.length;
        kt += stage.value.timesDict.kol慈;
        jt += stage.value.timesDict["💎"];
      }
      autoResults.value.at(-1).dict[j] = {
        score: Number((score / formData.value.skipTimes).toFixed(2)),
        jewelryCount: Number(
          (jewelryCount / formData.value.skipTimes).toFixed(2)
        ),
        kt: Number((kt / formData.value.skipTimes).toFixed(2)),
        jt: Number((jt / formData.value.skipTimes).toFixed(2)),
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
  osusume.value = strategyPlay(
    stage.value,
    jewelryCountTarget.value,
    stage.value.sp == "mg2" ? "score" : "cost"
  );
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
input[type="number"] {
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
</style>
