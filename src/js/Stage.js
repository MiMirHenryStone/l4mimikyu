import Card from "./Card";

export default class Stage {
  constructor(cards) {
    this.score = 0;
    this.te = [];
    this.sute = [];
    this.yama = cards;
    this.mental = true;
    this.protect = false;
    this.apMax = 20;
    this.ignition = false;
    this.timesDict = {};
    this.cardTimesDict = { apSkip: 0 };

    this.timesCount = 0;
    this.cardsCount = 0;

    this.sp = "";
    this.effect = "";

    this.teMax = 8;
    this.ap = 8;
    this.apSpeed = 2.5;

    this.drawHeartCount = 0;
    this.jewelryCountTarget = 0;

    this.hasCostEffect = false;

    this.testResults = [];
  }

  getAllCards() {
    return [...this.te, ...this.sute, ...this.yama];
  }

  getDrawYama() {
    return this.yama.length ? this.yama : this.sute;
  }

  start() {
    if (this.sp == "kz2") this.ap = Infinity;
    for (let i = 0; i < this.teMax; i++) {
      let index = Math.floor(Math.random() * this.yama.length);
      let card = this.yama.splice(index, 1)[0];
      this.te.push(card);
    }

    this.hasCostEffect = ["st1a"].includes(this.effect);

    this.testAllCards();
  }

  draw(index, drawFilter) {
    if (!this.yama.length) {
      this.yama = [...this.sute];
      this.sute = [];

      if (this.effect == "kj1a") {
        this.yama.forEach((c) => {
          if (c.getMain(this) == "reshuffle") c.cost++;
        });
      }
    }

    let yama;
    if (drawFilter) {
      yama = this.yama.filter((i) => i.matchAttrs(drawFilter));
      if (!yama.length) yama = this.yama;
    } else yama = this.yama;

    let i = Math.floor(Math.random() * yama.length);
    let card = yama[i];
    this.yama.splice(this.yama.indexOf(card), 1);

    this.te[index] = card;
    card.onDraw(this);
  }

  autoAp() {
    if (this.sp != "kz2") this.addAp(this.apSpeed);
  }

  useCard(index) {
    if (index == undefined) {
      // console.log("AP SKIP");
      this.cardTimesDict.apSkip++;
      this.autoAp();
      this.timesCount++;
      return;
    }
    let card = this.te[index];
    if (!this.cardTimesDict[card.short]) this.cardTimesDict[card.short] = 0;
    this.cardTimesDict[card.short]++;
    let isReshuffle = card.isReshuffle(this);
    card.onSkill(this);
    for (let c of this.te) {
      c.onCross(this, card);
    }
    if (this.sp == "sy") this.score++;

    if (isReshuffle) {
      for (let i in this.te) {
        if (i != index) {
          this.sute.push(this.te[i]);
        }
      }
      if (card.props?.yamaReshuffle) {
        this.yama.push(...this.sute.splice(0));
      }
      for (let i = 0; i < this.teMax; i++) {
        this.draw(i, card.props?.drawFilters?.[i]);
      }
    } else {
      this.draw(index, card.props?.drawFilters?.[0]);
    }

    if (card.props?.once) {
      // delete card;
    } else if (card.props?.yamaUse) {
      this.yama.push(card);
    } else {
      this.sute.push(card);
    }

    if (this.sp != "kz2") {
      this.addAp(-card.getCost(this.te));
      this.autoAp();
    }

    card.cost = card.props.cost;

    card.afterSkill(this);

    this.timesCount++;
    this.cardsCount++;

    if (this.effect == "kj1b" && this.cardsCount % 5 == 0) {
      this.sute.push(...this.te.splice(0));
      for (let i = 0; i < this.teMax; i++) this.draw(i);
    }
    if (this.effect == "st1a" && this.cardsCount % 6 == 0) {
      this.getAllCards().forEach((c) => c.cost++);
    }

    if (!this.protect && this.sp != "mg2") this.mental = false;

    this.testAllCards();
  }

  calcTestDrawHeartCount() {
    let n = 0;
    let cards = this.getAllCards();
    let jewelryCount = cards.filter((c) => c.short == "💎").length;
    if (jewelryCount < this.jewelryCountTarget) {
      for (let i = 0; i < this.jewelryCountTarget - jewelryCount; i++)
        cards.push(new Card("💎"));
    }
    cards.forEach((c) => {
      n += c.calcDrawHeartCount(this);
    });
    this.drawHeartCount = n;
    return n;
  }

  testCard(index, drawCard) {
    let short = this.te[index].short;
    if (short == "kol慈") return 0.01;
    if (["ritm吟", "pa吟"].includes(short)) return -0.01;

    let testStage = new Stage([]);
    for (let c of this.te) testStage.te.push(c.copy());
    for (let c of this.sute) testStage.sute.push(c.copy());
    for (let c of this.yama) testStage.yama.push(c.copy());
    testStage.mental = this.mental;
    testStage.protect = this.protect;
    testStage.ap = this.ap;
    testStage.apMax = this.apMax;
    testStage.apSpeed = this.apSpeed;
    testStage.ignition = this.ignition;
    testStage.timesDict = this.timesDict;
    testStage.sp = this.sp;
    testStage.jewelryCountTarget = this.jewelryCountTarget;

    let oldCost, newCost;
    if (drawCard) {
      oldCost = testStage.te[index].getCost(testStage.te);
      testStage.te[index] = drawCard;
      newCost = testStage.te[index].getCost(testStage.te);
      if (
        testStage.sp == "mg2" ||
        testStage.sp == "tz2" ||
        testStage.sp == "kz2"
      ) {
        oldCost = 1;
        newCost = 1;
      }

      if (newCost > testStage.apMax) return 0;
    }

    let card = testStage.te[index];
    let skill = card.getSkill(this);
    let isReshuffle = card.isReshuffle(testStage);

    card.onSkill(testStage);
    for (let c of testStage.te) {
      c.onCross(testStage, card);
    }

    testStage.calcTestDrawHeartCount();

    let res = testStage.score;

    if (isReshuffle)
      res +=
        (testStage.drawHeartCount * this.teMax) /
        (testStage.getAllCards().length + (skill?.cards?.length ?? 0));

    if (card.props?.drawFilters?.length == 1 && !drawCard) {
      let drawFilter = card.props?.drawFilters[0];
      let results = testStage
        .getDrawYama()
        .filter((c) =>
          Object.keys(drawFilter).every((key) => c[key] == drawFilter[key])
        );
      results.forEach(
        (c) => (res += testStage.testCard(index, c) / results.length)
      );
    }

    if (card.props?.once) {
      res +=
        ((testStage.drawHeartCount - card.calcDrawHeartCount(testStage)) /
          (testStage.getAllCards().length - 1) -
          testStage.drawHeartCount / testStage.getAllCards().length) *
        this.teMax;
    }
    if (skill?.cards?.length) {
      res +=
        (testStage.drawHeartCount /
          (testStage.getAllCards().length + skill?.cards?.length) -
          testStage.drawHeartCount / testStage.getAllCards().length) *
        this.teMax;
    }

    if (skill?.cards?.length) res /= skill?.cards?.length + 1;

    if (skill?.ap <= -testStage.apMax)
      res /= Math.ceil(
        Math.min(
          ...testStage.te.filter((c) => c != card).map((c) => c.getCost())
        ) / testStage.apSpeed
      );

    if (card.short == "上升姬芽") res *= 3 / 4;

    if (drawCard) res /= (oldCost + newCost) * oldCost;

    if (res < 0) return 0;

    return res;
  }

  testAllCards() {
    this.testResults = this.te.map((c, i) => this.testCard(i));
  }

  trigger(s) {
    if (s) {
      this.addAp(s.ap);
      this.addHeart(s.heart);
      this.addVoltage(s.voltage);
      this.addMental(s.mental);
      this.addProtect(s.protect);
      this.subtractAp(s["ap-"]);
      this.addCard(s.cards);
    }
  }

  addHeart(t) {
    if (t) {
      this.score += t;
    }
  }
  addVoltage(t) {
    if (t) {
      if (this.sp == "tz") {
        this.score += t;
        this.addAp(1 * t);
      }
    }
  }
  addMental(t) {
    if (t) {
      if (t > 0 && this.sp == "mg2") {
        this.score += t;
        this.addAp(1 * t);
      }

      if (t > 0) this.mental = true;
      else if (t < 0 && this.sp != "mg2") this.mental = false;
    }
  }
  addProtect(t) {
    if (t) {
      if (this.sp == "mg2") {
        this.score += t;
        this.addAp(2 * t);
      }
      this.protect = true;
    }
  }
  subtractAp(t) {
    if (t?.length) {
      for (let c of this.getAllCards()) {
        c.cost += c.calcSubtractAp(t);
      }
    }
  }
  addCard(t) {
    if (t?.length) {
      for (let i of t) {
        this.yama.push(new Card(i));
      }
    }
  }
  addAp(t) {
    if (t) {
      let ap = this.ap + t;
      if (ap > this.apMax) ap = this.apMax;
      if (ap < 0) ap = 0;
      this.ap = Number(ap.toFixed(2));
    }
  }
}
