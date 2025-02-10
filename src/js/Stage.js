import Card from "./Card";

const defaultHeartMax = 100;

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
    this.ignitionTimesDict = {};
    this.cardTimesDict = { apSkip: 0 };

    this.ignitionChangeQueue = [];
    this.drawFilterStack = [];

    this.timesCount = 0;
    this.cardsCount = 0;

    this.sp = "";
    this.effect = "";

    this.teMax = 8;
    this.ap = 0;
    this.apSpeed = 2.5;

    this.heartMax = defaultHeartMax;

    this.drawHeartCount = 0;
    this.jewelryCountTarget = 0;

    this.hasCostEffect = false;

    this.testResults = [];

    this.hasIgnitionCard = false;
    this.hasIgnitionAndScoreCard = false;
    this.hasEnsemble = false;
    this.scoreCardCount = 0;

    this.yData = [];
  }

  getAllCards() {
    return [...this.te, ...this.sute, ...this.yama];
  }

  getDrawYama() {
    return this.yama.length ? this.yama : this.sute;
  }

  start() {
    this.autoAp();
    this.hasIgnitionCard =
      this.getAllCards().filter(
        (c) => c.props?.main == "mental" || c.props?.main == "protect"
      ).length > 0;
    this.hasIgnitionAndScoreCard =
      this.getAllCards().filter(
        (c) =>
          (c.props?.main == "mental" || c.props?.main == "protect") &&
          (c.isReshuffle(this) || c.getSkill(this)?.ap < 0)
      ).length > 0;
    this.hasEnsemble =
      this.getAllCards().filter((c) => c.props?.main == "ensemble").length > 0;
    this.scoreCardCount = this.getAllCards().filter(
      (c) => c.getSkill(this)?.ap < 0
    ).length;
    if (this.sp == "kz2") this.ap = Infinity;
    for (let i = 0; i < this.teMax; i++) {
      let index = Math.floor(Math.random() * this.yama.length);
      let card = this.yama.splice(index, 1)[0];
      this.te.push(card);
    }

    this.hasCostEffect = ["st1a"].includes(this.effect);

    this.testAllCards();
  }

  draw(index) {
    if (!this.yama.length) {
      this.yama = [...this.sute];
      this.sute = [];

      if (this.effect == "kj1a") {
        this.addAp(3);
        this.yama.forEach((c) => {
          if (c.getMain(this) == "reshuffle") c.cost++;
        });
      }
    }

    let yama;
    let drawFilter = this.drawFilterStack.pop();
    if (drawFilter) {
      yama = this.yama.filter((i) => i.matchAttrs(drawFilter));
      if (!yama.length) yama = this.yama;
    } else {
      yama = this.yama.filter((i) => i.isDrawnFilter(this));
    }
    if (!yama.length) yama = this.yama;

    let i = Math.floor(Math.random() * yama.length);
    let card = yama[i];
    this.yama.splice(this.yama.indexOf(card), 1);

    this.te[index] = card;
    card.onDraw(this);
  }

  autoAp() {
    this.yData.push(this.section == 1 ? this.heartMax : this.score);
    if (this.sp != "kz2") this.addAp(this.apSpeed);
  }

  useCard(index, extra2 = false) {
    if (index == undefined) {
      // console.log("AP SKIP");
      this.cardTimesDict.apSkip++;
      this.autoAp();
      this.timesCount++;
      return;
    }

    this.usingCard = { heart: false };
    let te = [...this.te];

    let card = te[index];

    if (card.props?.drawFilters)
      this.drawFilterStack.push(...card.props?.drawFilters);

    if (!this.cardTimesDict[card.short]) this.cardTimesDict[card.short] = 0;
    this.cardTimesDict[card.short]++;

    if (this.sp != "kz2") {
      this.addAp(-card.getCost(te, this.ignition));
    }

    card.cost = card.props.cost;

    // skill -> cross -> afterSkill -> draw/reshuffle
    let isReshuffle = card.isReshuffle(this);

    card.onSkill(this);

    if (this.sp == "sy") this.trigger({ heart: [{}] });

    if (this.ignition && card.props?.ignitionTimes) {
      if (this.ignitionTimesDict[card.short] == undefined)
        this.ignitionTimesDict[card.short] = 0;
      this.ignitionTimesDict[card.short]++;
      if (this.ignitionTimesDict[card.short] >= card.props?.ignitionTimes) {
        this.trigger({ ignition: 0 });
        this.ignitionTimesDict[card.short] = 0;
      }
    }

    for (let c of te) {
      c.onCross(this, card);
    }

    card.afterSkill(this);

    if (card.props?.yamaUse) card.toYama = true;
    if (card.props?.yamaReshuffle)
      this.getAllCards().forEach((c) => {
        if (c != card) c.toYama = true;
      });
    if (card.props?.once) card.toOut = true;

    if (!extra2) {
      if (isReshuffle) {
        for (let i in te) {
          if (i != index) {
            this.sute.push(te[i]);
          }
        }
        this.yama.push(...this.sute.filter((c) => c.toYama && !c.toOut));
        this.sute = this.sute.filter((c) => !c.toYama && !c.toOut);
        for (let i = 0; i < this.teMax; i++) {
          this.draw(i);
        }
      } else {
        this.draw(index);
      }

      this.usingCard = false;
      for (let i = 0; i < this.ignitionChangeQueue.length; i++) {
        this.trigger({ ignition: this.ignitionChangeQueue.shift() });
      }

      if (card.toOut) {
        // delete card;
      } else if (card.toYama) {
        this.yama.push(card);
      } else {
        this.sute.push(card);
      }

      this.getAllCards().forEach((c) => (c.toYama = false));
    }

    this.cardsCount++;
    if (!extra2) this.timesCount++;

    if (this.effect == "gc1a" && this.cardsCount % 30 == 0) {
      this.getAllCards().forEach((c) => {
        if (c.getMain() == "mental") c.costDelta--;
      });
    } else if (this.effect == "gc1b" && this.cardsCount % 15 == 0) {
      this.getAllCards().forEach((c) => {
        if (c.unit == "srb") c.costDelta--;
      });
    } else if (this.effect == "gc1c" && this.cardsCount % 20 == 0) {
      this.getAllCards().forEach((c) => {
        if (c.unit == "drk") c.costDelta--;
      });
    } else if (this.effect == "kj1b" && this.cardsCount % 5 == 0) {
      this.sute.push(...this.te.splice(0));
      for (let i = 0; i < this.teMax; i++) this.draw(i);
    } else if (this.effect == "st1a" && this.cardsCount % 6 == 0) {
      this.getAllCards().forEach((c) => c.cost++);
    } else if (this.effect == "kj2a" && this.cardsCount % 3 == 0) {
      this.sute.push(...this.te.splice(0));
      for (let i = 0; i < this.teMax; i++) this.draw(i);
    } else if (this.effect == "kj2b" && this.cardsCount % 10 == 0) {
      this.getAllCards().forEach((c) => {
        c.cost--;
      });
    } else if (this.effect == "kj2c") {
      this.trigger({ ap: 1 });
    }

    if (!this.protect && this.sp != "mg2") this.mental = false;

    if (!extra2) {
      this.autoAp();
      this.testAllCards();
    }
  }

  calcTestDrawHeartCount() {
    let n = 0;
    let cards = this.getAllCards();
    let jewelryCount = cards.filter((c) => c.short == this.targetCard1).length;
    if (jewelryCount < this.jewelryCountTarget) {
      for (let i = 0; i < this.jewelryCountTarget - jewelryCount; i++)
        cards.push(new Card(this.targetCard1));
    }
    cards.forEach((c) => {
      n += c.calcDrawHeartCount(this);
    });
    this.drawHeartCount = n;
    return n;
  }

  calcNextDrawHeartCount(card) {
    let m = 0,
      n = 0,
      yama = [],
      sute = [];
    let allCards = this.getAllCards();
    yama = card.props?.yamaReshuffle
      ? allCards.filter((c) => c != card)
      : this.yama;
    yama.forEach((c) => {
      m += c.calcDrawHeartCount(this);
    });
    if (yama.length < this.teMax) {
      sute = [...this.sute, ...this.te.filter((c) => c != card)];
      sute.forEach((c) => (n += c.calcDrawHeartCount(this)));
      return (
        ((m + (n / sute.length) * (this.teMax - yama.length)) /
          allCards.length) *
          Math.min(allCards.length, this.teMax * 2) +
        (((this.drawHeartCount * this.teMax) / allCards.length) *
          Math.max(0, allCards.length - this.teMax * 2)) /
          allCards.length
      );
    } else {
      return (
        (((m / yama.length) * this.teMax) / allCards.length) *
          Math.min(allCards.length, this.teMax * 2) +
        (((this.drawHeartCount * this.teMax) / allCards.length) *
          Math.max(0, allCards.length - this.teMax * 2)) /
          allCards.length
      );
    }
  }

  testCard(index, drawCard) {
    let short = drawCard ? drawCard.short : this.te[index].short;
    if (short == this.targetCard0) return 0.01;
    else if (short == this.targetCard1) return 0;
    else if (
      [
        "ritm吟",
        "蓝远梢",
        "蓝远花帆",
        "pa吟",
        "水母吟",
        "花结吟",
        "kol慈",
      ].includes(short)
    )
      return -0.01;

    let testStage = new Stage([]);
    testStage.usingCard = { heart: false };
    for (let c of this.te) testStage.te.push(c.copy());
    for (let c of this.sute) testStage.sute.push(c.copy());
    for (let c of this.yama) testStage.yama.push(c.copy());
    testStage.mental = this.mental;
    testStage.protect = this.protect;
    testStage.ap = this.ap;
    testStage.apMax = this.apMax;
    testStage.apSpeed = this.apSpeed;
    testStage.ignition = this.ignition;
    testStage.ignitionTimesDict = { ...this.ignitionTimesDict };
    testStage.sp = this.sp;
    testStage.jewelryCountTarget = this.jewelryCountTarget;
    testStage.scoreCardCount = this.scoreCardCount;
    testStage.section = this.section;
    testStage.targetCard0 = this.targetCard0;
    testStage.targetCard1 = this.targetCard1;

    let oldLength = testStage.getAllCards().length;

    let oldCost, newCost;
    if (drawCard) {
      oldCost = testStage.te[index].getCost(testStage.te, testStage.ignition);
      testStage.te[index] = drawCard;
      newCost = testStage.te[index].getCost(testStage.te, testStage.ignition);
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
    let skill = card.getSkill(testStage);
    if (skill) skill = { ...skill, ensemble: false };
    let isReshuffle = card.isReshuffle(testStage);

    card.onSkill(testStage);
    for (let c of testStage.te) {
      c.onCross(testStage, card);
    }

    testStage.calcTestDrawHeartCount();

    let res =
      testStage.section == 1
        ? testStage.heartMax - defaultHeartMax
        : testStage.score;
    let newLength = testStage.getAllCards().length;

    if (isReshuffle) res += testStage.calcNextDrawHeartCount(card);

    if (card.props?.drawFilters?.length == 1 && !drawCard) {
      let drawFilter = card.props?.drawFilters[0];
      let results = testStage
        .getDrawYama()
        .filter((c) =>
          Object.keys(drawFilter).every((key) => c[key] == drawFilter[key])
        );
      results.forEach((c) => {
        let newTe = [...testStage.te];
        newTe[index] = c;
        if (
          c.getCost(newTe, testStage.ignition) <=
          testStage.ap -
            card.getCost(testStage.te, testStage.ignition) +
            testStage.apSpeed
        )
          res += testStage.testCard(index, c) / results.length;
      });
    }

    // 打掉衣服提高循环速度
    if (card.props?.once) {
      res +=
        ((testStage.drawHeartCount - card.calcDrawHeartCount(testStage)) /
          (oldLength - 1) -
          testStage.drawHeartCount / oldLength) *
        Math.min(
          this.hasEnsemble ? newLength / testStage.teMax : Infinity,
          isReshuffle ? testStage.teMax : testStage.teMax ** 3
        );
    }

    // 衣服降低循环速度
    res +=
      (testStage.drawHeartCount / newLength -
        testStage.drawHeartCount / oldLength) *
      Math.min(
        this.hasEnsemble ? newLength / testStage.teMax : Infinity,
        testStage.teMax
      );

    // 打掉衣服回合
    if (newLength > oldLength)
      res /=
        (newLength - oldLength) /
          (this.hasEnsemble ? newLength / testStage.teMax : 1) +
        1;

    if (skill?.ap <= -testStage.apMax && !isReshuffle)
      res /= Math.ceil(
        Math.min(
          ...this.te
            .filter((c) => c != card && c.short != this.targetCard1)
            .map((c) => c.getCost(this.te, this.ignition))
        ) / testStage.apSpeed
      );

    if (card.short == "上升姬芽") {
      if (!this.hasIgnitionAndScoreCard) res *= 3 / 4;
      if (this.hasCostEffect)
        res *= card.getCost(testStage.te, testStage.ignition);
    }

    if (drawCard) res /= Math.max(2, (oldCost + newCost) / oldCost);

    if (res < 0) return 0;

    return res;
  }

  testAllCards() {
    this.testResults = this.te.map((c, i) => this.testCard(i));
  }

  trigger(s) {
    if (s) {
      for (let key in s) {
        let value = s[key];

        if (key == "ap") this.addAp(value);
        if (key == "heart") this.addHeart(value);
        if (key == "voltage") this.addVoltage(value);
        if (key == "mental") this.addMental(value);
        if (key == "protect") this.addProtect(value);
        if (key == "ap-") this.subtractAp(value);
        if (key == "cards") this.addCard(value);
        if (key == "heartMax") this.heartMax += value;
        if (key == "ensemble") this.ensemble(value);

        if (key == "ignition") this.changeIgnition(value);

        if (key == "spAp") this.addAp(value);
      }
    }
  }

  addHeart(t) {
    if (t?.length) {
      if (!this.usingCard) debugger;
      if (!this.usingCard.heart && t[0].over) this.score++;
      this.score += t.length;
      this.usingCard.heart = true;
    }
  }
  addVoltage(t) {
    if (t?.length) {
      if (this.sp == "tz") {
        this.addHeart(t);
      }
      if (this.sp == "tz2") {
        t.forEach((i) => this.addAp(i.spAp ?? 1));
      }
    }
  }
  addMental(t) {
    if (t?.length) {
      t.forEach((i) => {
        if (!i.minus && this.sp == "mg2") {
          this.addHeart([i]);
          this.addAp(i.spAp ?? 1);
        }
        if (i.minus && this.sp != "mg2") this.mental = false;
        else this.mental = true;
      });
    }
  }
  addProtect(t) {
    if (t?.length) {
      if (this.sp == "mg2") {
        this.addHeart(t);
        t.forEach((i) => this.addAp(i.spAp ?? 2));
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
      let ap = Math.floor(this.ap);
      let ap_ = this.ap - ap;
      ap += t;
      if (ap < 0) ap = 0;
      ap += ap_;
      if (ap > this.apMax) ap = this.apMax;
      this.ap = Number(ap.toFixed(2));
    }
  }
  changeIgnition(t) {
    if (t != undefined) {
      if (this.usingCard) {
        this.ignitionChangeQueue.push(t);
      } else {
        if (t == 1) this.ignition = true;
        else if (t == 0) this.ignition = false;
        else if (t == -1) this.ignition = !this.ignition;
      }
    }
  }
  ensemble(t) {
    if (t) {
      this.te.forEach((c, i) => {
        if (!c.getSkill(this)?.ensemble) this.useCard(i, this.te);
      });
    }
  }
}
