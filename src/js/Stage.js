export default class Stage {
  constructor(cards) {
    this.score = 0;
    this.te = [];
    this.sute = [];
    this.yama = cards;
    this.ignition = false;
    this.timesDict = { kol慈: 0, "💎": 0 };

    this.timesCount = 0;

    this.sp = "";
    this.effects = {};

    this.teMax = 8;
    this.apMax = 20;
  }

  getAllCards() {
    return [...this.te, ...this.sute, ...this.yama];
  }

  getDrawYama() {
    return this.yama.length ? this.yama : this.sute;
  }

  start() {
    for (let i = 0; i < this.teMax; i++) {
      let index = Math.floor(Math.random() * this.yama.length);
      let card = this.yama.splice(index, 1)[0];
      this.te.push(card);
    }
  }

  draw(index, drawFilter) {
    if (!this.yama.length) {
      this.yama = [...this.sute];
      this.sute = [];

      if (this.effects.a) {
        this.yama.forEach((c) => {
          if (c.getMain(this) == "reshuffle") c.cost += 1;
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
    this.yama.splice(
      this.yama.findIndex((i) => i.short == card.short),
      1
    );

    this.te[index] = card;
    card.onDraw(this);
  }

  useCard(index) {
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
    } else {
      this.sute.push(card);
    }

    card.cost = card.props.cost;

    card.afterSkill(this);

    this.timesCount++;

    if (this.effects.b && this.timesCount % 5 == 0) {
      this.sute.push(...this.te.splice(0));
      for (let i = 0; i < this.teMax; i++) this.draw(i);
    }
  }

  testCard(index) {
    let testStage = new Stage([]);
    for (let c of this.te) testStage.te.push(c.copy());
    testStage.ignition = this.ignition;
    testStage.timesDict = this.timesDict;
    testStage.sp = this.sp;

    let card = testStage.te[index];
    let isReshuffle = card.isReshuffle(this);
    card.onSkill(testStage);
    for (let c of testStage.te) {
      c.onCross(testStage, card);
    }

    if (card.props?.once) {
      // delete card;
    } else {
      testStage.sute.push(card);
    }

    card.cost = card.props.cost;

    return testStage.score;
  }

  trigger(s) {
    this.addHeart(s.heart);
    this.addVoltage(s.voltage);
    this.addMental(s.mental);
    this.addProtect(s.protect);
    this.subtractAp(s["ap-"]);
  }

  addHeart(t) {
    if (t) {
      this.score += t;
    }
  }
  addVoltage(t) {
    if (t) {
      if (this.sp == "td") this.score += t;
    }
  }
  addMental(t) {
    if (t) {
      if (this.sp == "mg2") this.score += t;
    }
  }
  addProtect(t) {
    if (t) {
      if (this.sp == "mg2") this.score += t;
    }
  }
  subtractAp(t) {
    if (t?.length) {
      for (let c of this.getAllCards()) {
        c.cost += c.calcSubtractAp(t);
      }
    }
  }
}
