<template>
  <div>
    <template v-if="!ing">
      <h2>DECK</h2>
      <hr />
      <div class="grid">
        <card-item
          v-for="(c, i) in deck"
          :key="i"
          :card="c"
          :close="true"
          @click="deck.splice(i, 1)"
        ></card-item>
      </div>
      <h2>CARD</h2>
      <hr />
      <div class="grid">
        <card-item
          v-for="(c, i) in cards"
          :key="i"
          :card="c"
          @click="deck.push(new Card(c.short))"
        ></card-item>
      </div>
    </template>

    <form>
      <h2>STAGE</h2>
      <hr />
      <div>
        <label for="jewelry">JEWELRY: </label>
        <input
          v-model="jewelryCountTargetMax"
          :disabled="ing"
          type="number"
          id="jewelry"
        />
      </div>
      <div>
        <label for="sp">SP: </label>
        <select v-model="sp" :disabled="ing" id="sp">
          <option value="">--</option>
          <option value="td">舞会缀</option>
          <option value="sy">舞会沙耶</option>
          <option value="mg2">银河慈</option>
        </select>
      </div>
      <div>
        <input
          v-model="effects.a"
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
          v-model="effects.b"
          :disabled="ing"
          type="checkbox"
          id="104-3-3-1-b"
        />
        <label for="104-3-3-1-b">
          skill5回使用 手札全捨 山札手札上限引直
        </label>
      </div>
      <div>
        <label for="card-time">CARD回数: </label>
        <input
          v-model="cardTimes"
          :disabled="ing"
          type="number"
          id="card-time"
        />
      </div>
      <div>
        <label for="skip-time">SKIP回数: </label>
        <input
          v-model="skipTimes"
          :disabled="ing"
          type="number"
          id="skip-time"
        />
      </div>
    </form>

    <div style="text-align: right">
      <button v-if="ing" @click="retire">RETIRE</button>
      <template v-else>
        <button @click="start(true)">SKIP</button>
        <button @click="start(false)">LIVE START</button>
      </template>
    </div>

    <template v-if="ing">
      <template v-if="auto">
        <table style="width: 100%">
          <tr>
            <td>target jewelry</td>
            <td>actual jewelry</td>
            <td>score</td>
            <td>percent</td>
          </tr>
          <tr v-for="(item, key) in autoResults" :key="key">
            <td>{{ key }}</td>
            <td>{{ item.jewelryCount }}</td>
            <td>{{ item.score }}</td>
            <td>
              {{
                Number(
                  (
                    (item.score /
                      Math.max(
                        ...Object.values(autoResults).map((i) => i.score)
                      )) *
                    100
                  ).toFixed(2)
                )
              }}
            </td>
          </tr>
        </table>
      </template>
      <template v-else>
        <h2>
          {{ stage.score }}
          <div style="float: right">{{ stage.timesCount }}回</div>
        </h2>
        <h2 v-if="stage.ignition">🔥</h2>
        <h2 v-else>🚫</h2>
        <h2>手札 {{ stage.te.length }}</h2>
        <hr />
        <div class="grid">
          <card-item
            v-for="(c, i) in stage.te"
            :key="i"
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
            :key="i"
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
            :key="i"
            :card="c"
            :stage="stage"
            pointer-events="none"
          ></card-item>
        </div>
      </template>
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
const autoResults = ref({});

const jewelryCountTarget = ref(9);
const jewelryCountTargetMax = ref(20);
const cardTimes = ref(360);
const skipTimes = ref(36);

const sp = ref("mg2");
const effects = ref({});

const cards = cardList.map((i) => new Card(i.short));

const deck = ref(
  cardList
    .filter((i) => typeof i.member == "number")
    .map((i) => new Card(i.short))
    .slice(0, 14)
);

const stage = ref();
const newStage = () => {
  stage.value = new Stage([]);
  stage.value.sp = sp.value;
  stage.value.effects = effects.value;
};
newStage();

const retire = () => {
  ing.value = false;
  autoResults.value = {};
  newStage();
};

const start = async (a) => {
  ing.value = true;
  auto.value = a;
  if (a) {
    for (let j = 0; j <= Number(jewelryCountTargetMax.value); j++) {
      await sleep(100);
      if (!ing.value) break;
      autoResults.value[j] = { list: [] };
      let score = 0;
      let jewelryCount = 0;
      for (let s = 0; s < Number(skipTimes.value); s++) {
        newStage();
        stage.value.yama = deck.value.map((i) => new Card(i.short));
        stage.value.start();
        for (let k = 0; k < Number(cardTimes.value); k++) {
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
        // autoResults.value[j].list.push({
        //   score: stage.value.score,
        //   jewelryCount: stage.value.getAllCards().filter((i) => i.member == "jewelry")
        //     ?.length,
        // });
      }
      autoResults.value[j].score = Number((score / skipTimes.value).toFixed(2));
      autoResults.value[j].jewelryCount = Number(
        (jewelryCount / skipTimes.value).toFixed(2)
      );
      if (!ing.value) break;
    }
  } else {
    stage.value.yama = deck.value.map((i) => new Card(i.short));
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
  border-spacing: 0;
  tr:nth-child(2n) {
    background: #aaaaaa55;
  }
  td {
    padding: 2px;
  }
}
h2 {
  margin-bottom: 0;
}
form > div {
  margin: 0.5em 0;
}
select,
input {
  padding: 0.25em;
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
