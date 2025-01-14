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
    this.timesDict = { kol慈: 0, "💎": 0, apSkip: 0 };

    this.timesCount = 0;
    this.cardsCount = 0;

    this.sp = "";
    this.effect = "";

    this.teMax = 8;
    this.ap = 8;
    this.apSpeed = 2.5;

    this.drawHeartCount = 0;

    this.testResults = [];
  }

  getAllCards() {
    return [...this.te, ...this.sute, ...this.yama];
  }

  getDrawYama() {
    return this.yama.length ? this.yama : this.sute;
  }

  calcDrawHeartCount() {
    let n = 0;
    this.getAllCards().forEach((c) => {
      let draw;
      if (c.props?.draw) {
        if (typeof c.props?.draw == "function") draw = c.props?.draw(this);
        else draw = c.props?.draw;
      }
      n += draw?.heart || 0;
      if (this.sp == "tz") n += draw?.voltage || 0;
      if (this.sp == "mg2") n += (draw?.mental || 0) + (draw?.protect || 0);
    });
    this.drawHeartCount = n;
    return n;
  }

  start() {
    if (this.sp == "kz2") this.ap = Infinity;
    for (let i = 0; i < this.teMax; i++) {
      let index = Math.floor(Math.random() * this.yama.length);
      let card = this.yama.splice(index, 1)[0];
      this.te.push(card);
    }
    this.calcDrawHeartCount();

    this.testResults = this.te.map((c, i) => this.testCard(i));
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
      this.timesDict.apSkip++;
      this.autoAp();
      this.timesCount++;
      return;
    }
    let card = this.te[index];
    if (card.short == "kol慈" || card.short == "💎")
      this.timesDict[card.short]++;
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

    this.calcDrawHeartCount();

    if (this.sp != "kz2") {
      this.addAp(-card.getCost(true));
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

    this.testResults = this.te.map((c, i) => this.testCard(i));
  }

  testCard(index) {
    let testStage = new Stage([]);
    for (let c of this.te) testStage.te.push(c.copy());
    testStage.mental = this.mental;
    testStage.protect = this.protect;
    testStage.ap = this.ap;
    testStage.apSpeed = this.apSpeed;
    testStage.ignition = this.ignition;
    testStage.timesDict = this.timesDict;
    testStage.sp = this.sp;

    let card = testStage.te[index];
    let isReshuffle = card.isReshuffle(this);

    card.onSkill(testStage);
    for (let c of testStage.te) {
      c.onCross(testStage, card);
    }

    return (
      ((testStage.score +
        (isReshuffle
          ? (this.drawHeartCount * 8) / this.getAllCards().length
          : 0)) /
        (1 +
          (card.props?.skill?.cards?.length
            ? card.props?.skill?.cards?.length * 8
            : 0))) *
      (card.short == "上升姬芽" ? 3 / 4 : 1)
    );
  }

  trigger(s) {
    this.addAp(s.ap);
    this.addHeart(s.heart);
    this.addVoltage(s.voltage);
    this.addMental(s.mental);
    this.addProtect(s.protect);
    this.subtractAp(s["ap-"]);
    this.addCard(s.cards);
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
