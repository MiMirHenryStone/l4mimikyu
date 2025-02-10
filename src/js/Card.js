const apMax = 20;

export default class Card {
  constructor(short) {
    this.short = short;
    this.props = { short };
    let props = cardList.find((i) => i.short == short);
    if (props) {
      this.props = props;
      this.member = props.member;
      let si = schoolIdol.find((i) => i.member == props.member);
      if (si) {
        this.year = si.year;
        this.unit = si.unit;
      }

      this.cost = props.cost;
      this.ignitionCost = props.ignitionCost ?? props.cost;
      this.costDelta = 0;
      this.teCostDelta = 0;
    }
  }

  copy() {
    let newCard = new Card(this.short);
    newCard.cost = this.cost;
    newCard.costDelta = this.costDelta;
    newCard.teCostDelta = this.teCostDelta;
    return newCard;
  }

  getMain(stage) {
    if (this.props?.main) {
      if (typeof this.props.main == "function") {
        return this.props.main(stage);
      } else {
        return this.props.main;
      }
    }
    return "";
  }

  getCost(te, ignition) {
    let cost = ignition
      ? this.ignitionCost + this.cost - this.props?.cost ?? this.cost
      : this.cost;
    cost += this.costDelta;
    if (te && this.props?.teCostDelta) cost += this.props?.teCostDelta(te);
    if (te) cost += this.teCostDelta;
    if (this.props?.spCostDelta) cost += this.props?.spCostDelta(te);
    return cost >= 1 ? cost : 1;
  }

  getCalcCost(stage) {
    let skill = this.getSkill(stage);
    let cost = this.getCost(stage.te, stage.ignition);
    let calcCost = cost;
    calcCost -= skill?.ap ?? 0;
    calcCost -= skill?.spAp ?? 0;

    if (calcCost < 1) calcCost = 1;
    return calcCost;
  }

  isReshuffle(stage) {
    if (this.props?.reshuffle) {
      if (typeof this.props.reshuffle == "function") {
        return this.props.reshuffle(stage);
      } else {
        return this.props.reshuffle;
      }
    }
    return false;
  }

  isDrawnFilter(stage) {
    if (this.props?.drawnFilter) {
      if (typeof this.props.drawnFilter == "function") {
        return this.props.drawnFilter(stage);
      } else {
        return this.props.drawnFilter;
      }
    }
    return false;
  }

  getSkill(stage) {
    if (this.props?.skill) {
      if (typeof this.props.skill == "function") {
        return this.props.skill(stage);
      } else {
        return this.props.skill;
      }
    }
  }

  onSkill(stage) {
    stage.trigger(this.getSkill(stage));
  }

  afterSkill(stage) {
    if (this.props?.afterSkill) {
      this.props.afterSkill(stage, this);
    }
  }

  onDraw(stage) {
    this.teCostDelta = 0;
    if (this.props?.draw) {
      if (typeof this.props.draw == "function") {
        stage.trigger(this.props.draw(stage, this));
      } else {
        stage.trigger(this.props.draw);
      }
    }
  }

  calcDrawHeartCount(stage) {
    let n = 0;
    let draw;
    if (this.props?.draw) {
      if (typeof this.props?.draw == "function") draw = this.props?.draw(stage);
      else draw = this.props?.draw;
    }
    n += draw?.heart?.length || 0;
    if (stage.sp == "tz") n += draw?.voltage?.length || 0;
    if (stage.sp == "mg2")
      n += (draw?.mental?.length || 0) + (draw?.protect?.length || 0);

    let m = 0;
    let skill = this.getSkill(stage);
    if (skill?.ap < 0) {
      m += skill.heart?.length || 0;
      if (stage.sp == "tz") m += skill?.voltage?.length || 0;
      if (stage.sp == "mg2")
        m += (skill?.mental?.length || 0) + (skill?.protect?.length || 0);
      let turn = stage.getAllCards().length / stage.teMax;
      n += (m * turn) / (turn + stage.scoreCardCount);
    }
    return n;
  }

  onCross(stage, card) {
    if (this.props?.cross) this.props.cross(stage, card, this);
  }

  matchAttrs(dict) {
    return Object.keys(dict).every((key) =>
      dict[key] == undefined ? true : dict[key] == this[key]
    );
  }

  calcSubtractAp(t) {
    let sa = 0;
    if (t?.length) {
      for (let i of t) {
        if (this.matchAttrs({ ...i, cost: undefined })) sa += i.cost;
      }
    }
    return sa;
  }
}

export const schoolIdol = [
  // { member: 0, short: "st", year: 101, unit: "" },
  { member: 3, short: "kz", year: 102, unit: "srb" },
  { member: 4, short: "tz", year: 102, unit: "drk" },
  { member: 6, short: "mg", year: 102, unit: "mrp" },
  { member: 1, short: "kh", year: 103, unit: "srb" },
  { member: 2, short: "sy", year: 103, unit: "drk" },
  { member: 5, short: "rr", year: 103, unit: "mrp" },
  { member: 7, short: "gn", year: 104, unit: "srb" },
  { member: 8, short: "sz", year: 104, unit: "drk" },
  { member: 9, short: "hm", year: 104, unit: "mrp" },
];

export const cardList = [
  {
    short: "圣夜吟",
    member: 7,
    cost: 8,
    main: "dress",
    reshuffle: true,
    skill: { cards: ["圣夜👗", "圣夜👗", "圣夜👗", "圣夜👗", "圣夜👗"] },
  },
  {
    short: "圣夜👗",
    member: "dress",
    cost: 3,
    main: "reshuffle",
    reshuffle: true,
    once: true,
    skill: { mental: [{}], voltage: [{}] },
  },
  {
    short: "pa吟",
    member: 7,
    cost: 4,
    main: "dress",
    skill: { cards: ["pa👗", "pa👗"] },
  },
  {
    short: "pa👗",
    member: "dress",
    cost: 2,
    main: "ap",
    once: true,
  },
  {
    short: "lttf铃",
    member: 8,
    cost: 9,
    main: "voltage",
    skill: { voltage: [{ over: true, spAp: 6 }], mental: [{ minus: true }] },
    drawFilters: [{ member: 9 }],
  },
  {
    short: "上升姬芽",
    member: 9,
    cost: 3,
    main(stage) {
      if (stage?.ignition) return "reshuffle";
      else return "mental";
    },
    reshuffle: (stage) => stage?.ignition,
    skill(stage) {
      let res = { mental: [{}], protect: [{}] };
      if (stage.ignition) {
        res["ap-"] = [{ unit: "mrp", cost: -3 }];
      }
      return res;
    },
    ignitionTimes: 3,
    cross(stage, card) {
      let main = card.getMain(stage);
      if (!stage.ignition) {
        if (main == "mental" || main == "protect") {
          stage.trigger({ ignition: 1 });
        }
      }
    },
  },
  {
    short: "pa姬芽",
    member: 9,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { protect: [{}] },
  },
  {
    short: "织姬花帆",
    member: 1,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: [{}] },
    draw(stage) {
      if (stage.section == 1) return { ap: 5 };
    },
  },
  {
    short: "音击花帆",
    member: 1,
    cost: 9,
    main: "heart",
    reshuffle: true,
    yamaReshuffle: true,
    skill: { heart: [{}, {}, {}] },
    draw: { heart: [{}], mental: [{}] },
  },
  {
    short: "lttf沙耶",
    member: 2,
    cost: 5,
    main: "voltage",
    skill: { voltage: [{ spAp: 3 }] },
    drawFilters: [{ member: 6 }],
  },
  {
    short: "沏茶瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { voltage: [{}] },
    draw: { heart: [{}] },
  },
  {
    short: "蛋糕瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { heart: [{}] },
    draw: { heart: [{}] },
  },
  {
    short: "花结梢",
    member: 3,
    cost: 13,
    main: "reshuffle",
    reshuffle: true,
    drawFilters: [
      { unit: "srb" },
      { member: "dress" },
      { unit: "srb" },
      { member: "dress" },
      { unit: "srb" },
      { member: "dress" },
      { unit: "srb" },
      { member: "dress" },
    ],
    skill: {
      "ap-": [
        { unit: "srb", cost: -3 },
        { member: "dress", cost: -3 },
      ],
    },
    cross(stage, card, self) {
      if (card.unit == "srb") {
        stage.trigger({ heart: [{}] });
        self.teCostDelta -= 3;
      }
    },
  },
  {
    short: "kol梢",
    member: 3,
    cost: 9,
    main: "mental",
    skill: { mental: [{ spAp: 5 }], heart: [{}] },
    draw: { "ap-": [{ member: 6, cost: -9 }] },
    cross(stage, card) {
      if (card.member == 6) stage.trigger({ protect: [{}], heart: [{}] });
    },
  },
  {
    short: "自由缀",
    member: 4,
    cost: 10 - 8,
    main: "mental",
    skill: { mental: [{ spAp: 6 }], heart: [{}] },
    draw(stage) {
      let res = {};
      if (stage.mental) res = { heart: [{}] };
      return res;
    },
  },
  {
    short: "kol缀",
    member: 4,
    cost: 3,
    main: "voltage",
    skill: { voltage: [{}], heart: [{}] },
    draw: {
      "ap-": [
        { member: 3, cost: -3 },
        { member: 6, cost: -3 },
      ],
    },
    cross(stage, card) {
      if (card.member == 6) stage.trigger({ voltage: [{}], heart: [{}] });
    },
  },
  {
    short: "af慈",
    member: 6,
    cost: 9,
    main: "protect",
    skill: {
      ap: -Infinity,
      protect: [{ spAp: 17 }],
      heart: [{ over: true }, {}, {}, {}, {}, {}, {}, {}, {}],
    },
  },
  {
    short: "kol慈",
    member: 6,
    cost: 39,
    main: "heart",
    skill: { heart: [{ over: true }], cards: ["💎"] },
    cross(stage, card, self) {
      if (
        card.member == 1 ||
        card.member == 2 ||
        card.member == 3 ||
        card.member == 4 ||
        card.member == 5 ||
        card.member == 7 ||
        card.member == 8 ||
        card.member == 9
      )
        self.teCostDelta -= 3;
    },
  },
  {
    short: "💎",
    member: "jewelry",
    cost: 1,
    main: "ap-",
    once: true,
    skill: { "ap-": [{ cost: -1 }] },
    draw: { heart: [{}], voltage: [{}], protect: [{}] },
  },
  {
    short: "舞会缀",
    member: 4,
    cost: 7 - 5,
    main: "voltage",
    skill: { voltage: [{ spAp: 5 }] },
  },
  {
    short: "舞会沙耶",
    member: 2,
    cost: 7 - 5,
    main: "love+",
  },
  // {
  //   short: "银河梢",
  //   member: 3,
  //   cost: 5 + 15,
  //   main: "heart",
  //   skill: { heart: [{ over: true }] },
  // },
  {
    short: "银河缀",
    member: 4,
    cost: 5 - 3,
    main: "voltage",
    skill: { voltage: [{ spAp: 6 }], heart: [{}] },
  },
  {
    short: "银河慈",
    member: 6,
    cost: 5,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: [{ over: true, spAp: 21 }], protect: [{ spAp: 10 }] },
  },
  {
    short: "讴歌梢",
    member: 3,
    cost: 5 - 2,
    main: "love+",
    draw: { heart: [{}] },
  },
  {
    short: "ritm梢",
    member: 3,
    cost: 5 - 3,
    main: "voltage",
    skill: { voltage: [{ spAp: 3 }] },
    draw: { mental: [{}] },
  },
  {
    short: "秋色梢",
    member: 3,
    cost: 6,
    main: "love+",
    draw: { mental: [{}] },
  },
  {
    short: "自由梢",
    member: 3,
    cost: 8 - 6,
    main: "protect",
    skill: { protect: [{ spAp: 4 }] },
    draw(stage) {
      let res = {};
      if (stage.mental) {
        res = { protect: [{ spAp: 6 }] };
      }
      return res;
    },
  },
  {
    short: "赠物梢",
    member: 3,
    cost: 3,
    main: "love+",
    drawnFilter(stage) {
      return stage.section == 1;
    },
    draw(stage) {
      if (stage.section == 1) return { ap: 8 };
    },
  },
  {
    short: "教师梢",
    member: 3,
    cost: 2,
    main: "heart",
    skill: { heart: [{}], mental: [{ minus: true }] },
    draw: { mental: [{}] },
  },
  {
    short: "蓝远梢",
    member: 3,
    cost: 3,
    main: "dress",
    skill: { cards: ["蓝远梢👗"] },
    cross(stage, card) {
      if (card.unit == "srb") stage.trigger({ voltage: [{}] });
    },
  },
  {
    short: "蓝远梢👗",
    member: "dress",
    cost: 3,
    main: "love+",
    once: true,
  },
  {
    short: "水母梢",
    member: 3,
    cost: 5,
    main: "love+",
    draw: { cards: ["🫧"] },
  },
  {
    short: "🫧",
    member: "bubble",
    cost: 1,
    main: "ap-",
    once: true,
    skill: {
      "ap-": [
        { unit: "srb", cost: -3 },
        { member: "dress", cost: -3 },
      ],
    },
  },
  {
    short: "af梢",
    member: 3,
    cost: 0,
    spCostDelta(te, ignition) {
      return (
        te
          ?.filter((c) => !c.props?.spCostDelta)
          ?.reduce((prev, curr) => prev + curr.getCost(te, ignition), 0) || 0
      );
    },
    main: "ensemble",
    reshuffle: true,
    drawnFilter: true,
    skill: {
      ap: -Infinity,
      ensemble: true,
      heart: [{}, {}, {}, {}, {}, {}, {}, {}, {}],
    },
  },
  {
    short: "ss缀",
    member: 4,
    cost: 5 - 2,
    main: "heart",
    skill: { heart: [{}] },
    draw: { voltage: [{}] },
  },
  {
    short: "雨伞缀",
    member: 4,
    cost: 5,
    main: "love+",
    draw: { heart: [{}] },
  },
  {
    short: "花火缀",
    member: 4,
    cost: 3,
    main: "voltage",
    skill: { voltage: [{}] },
    draw: { voltage: [{}] },
  },
  {
    short: "秋色缀",
    member: 4,
    cost: 6,
    main: "heart",
    skill(stage) {
      let res = {};
      if (stage.mental) res = { heart: [{}, {}, {}] };
      else res = { heart: [{}, {}] };
      return res;
    },
    draw: { mental: [{}] },
  },
  {
    short: "抱花缀",
    member: 4,
    cost: 4,
    main: "voltage",
    skill: { voltage: [{}] },
    draw: { voltage: [{}] },
  },
  {
    short: "音击缀",
    member: 4,
    cost: 9,
    main: "voltage",
    skill: { voltage: [{}], heart: [{}, {}, {}] },
    draw: { voltage: [{}], protect: [{}] },
  },
  {
    short: "af缀",
    member: 4,
    cost: 9,
    main: "voltage",
    skill: {
      ap: -Infinity,
      voltage: [{ over: true, spAp: 22 }],
      heart: [{ over: true }, {}, {}, {}, {}, {}, {}, {}, {}],
    },
  },
  {
    short: "蛋糕慈",
    member: 6,
    cost: 4,
    main: "mental",
    skill: { mental: [{}] },
    draw: { mental: [{}], protect: [{}] },
  },
  {
    short: "舞会慈",
    member: 6,
    cost: 3,
    main: "love+",
    yamaUse: true,
    skill: { mental: [{ minus: true }] },
    draw: { mental: [{}] },
  },
  {
    short: "圣诞慈",
    member: 6,
    cost: 4,
    main: "mental",
    skill: { mental: [{}, {}, {}] },
    draw: { mental: [{}] },
  },
  {
    short: "抱花慈",
    member: 6,
    cost: 4,
    main: "protect",
    skill: { protect: [{}] },
    draw: { protect: [{}] },
  },
  {
    short: "hsct慈",
    member: 6,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
  },
  {
    short: "mc慈",
    member: 6,
    cost: 10,
    main: "heart+",
    draw(stage, self) {
      if (stage.ignition && stage.section >= 4) self.teCostDelta -= 7;
    },
  },
  {
    short: "pa慈",
    member: 6,
    cost: 5,
    main: "heart+",
  },
  {
    short: "ritm花帆",
    member: 1,
    cost: 4 - 3,
    main: "heart",
    skill: { heart: [{}] },
    draw: { mental: [{}] },
  },
  {
    short: "讴歌花帆",
    member: 1,
    cost: 5 - 2,
    main: "mental",
    skill: { mental: [{}] },
    draw: { voltage: [{}] },
  },
  {
    short: "雨伞花帆",
    member: 1,
    cost: 3,
    main: "voltage",
    skill: { voltage: [{}] },
    draw: { mental: [{}] },
  },
  {
    short: "自由花帆",
    member: 1,
    cost: 6 - 4,
    main: "voltage",
    skill: { voltage: [{ spAp: 3 }], heart: [{}] },
    draw(stage) {
      let res = {};
      if (stage.mental) {
        res = { voltage: [{ spAp: 2 }] };
      }
      return res;
    },
  },
  {
    short: "舞会花帆",
    member: 1,
    cost: 6,
    main: "heart",
    skill: { heart: [{}] },
  },
  {
    short: "偶活花帆",
    member: 1,
    cost: 9,
    main: "heart",
    reshuffle: true,
    skill: { heart: [{}] },
    cross(stage, card, self) {
      if (card.member == 2 || card.member == 5) {
        self.teCostDelta -= 2;
      }
    },
  },
  {
    short: "快乐花帆",
    member: 1,
    cost: 2,
    main: "mental",
    skill: { mental: [{}], voltage: [{}] },
    draw: { mental: [{}], heart: [{}] },
  },
  {
    short: "蓝远花帆",
    member: 1,
    cost: 3,
    main: "dress",
    skill: { cards: ["蓝远花帆👗"] },
    cross(stage, card) {
      if (card.unit == "srb") stage.trigger({ voltage: [{}] });
    },
  },
  {
    short: "蓝远花帆👗",
    member: "dress",
    cost: 3,
    main: "heart",
    once: true,
    skill: { heart: [{}] },
    draw: { heartMax: 12 },
  },
  {
    short: "雨伞沙耶",
    member: 2,
    cost: 4,
    main: "mental",
    skill: { mental: [{}] },
    draw: { voltage: [{}] },
  },
  {
    short: "tc沙耶",
    member: 2,
    cost: 3,
    main: "love+",
    skill: { mental: [{ minus: true }] },
    draw: { voltage: [{}] },
  },
  {
    short: "宇宙沙耶",
    member: 2,
    cost: 4,
    main: "teMax",
    skill: { voltage: [{}] },
  },
  {
    short: "沏茶沙耶",
    member: 2,
    cost: 2,
    main: "love+",
    skill: { voltage: [{}] },
  },
  {
    short: "圣诞沙耶",
    member: 2,
    cost: 4,
    main: "voltage",
    skill: { voltage: [{}], heart: [{}, {}] },
    draw: { voltage: [{}] },
  },
  {
    short: "织姬沙耶",
    member: 2,
    cost: 15,
    main: "love++",
    draw(stage, self) {
      if (stage.section >= 2 && stage.section <= 4) self.teCostDelta -= 10;
    },
  },
  {
    short: "db瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { voltage: [{}] },
    draw(stage, self) {
      let res = { voltage: [{}] };
      if (stage.section <= 3) self.teCostDelta -= 1;
      return res;
    },
  },
  {
    short: "梦境瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { heart: [{}] },
  },
  {
    short: "rod瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: [{}] },
    draw: { mental: [{}] },
  },
  {
    short: "一专瑠璃",
    member: 5,
    cost: 5,
    main: "reshuffle",
    reshuffle: true,
    skill: { heart: [{}] },
  },
  {
    short: "abdl瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: [{}] },
  },
  {
    short: "tc瑠璃",
    member: 5,
    cost: 2,
    main: "reshuffle",
    reshuffle: true,
  },
  {
    short: "白昼瑠璃",
    member: 5,
    cost: 3,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: [{ minus: true }] },
    draw: { heart: [{}] },
  },
  {
    short: "mc瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill(stage) {
      let res;
      if (stage.ignition) {
        res = { heart: [{}] };
      } else {
        res = { ap: 1 };
      }
      return res;
    },
  },
  {
    short: "上升瑠璃",
    member: 5,
    cost: 3,
    ignitionCost: 13,
    main(stage) {
      if (stage?.ignition) return "love++";
      else return "teMax";
    },
    reshuffle: (stage) => stage?.ignition && stage?.mental,
    skill(stage) {
      let res = {};
      if (stage.ignition) {
        if (stage.mental) {
          res.heart = [{ over: true }];
          res.mental = [{ minus: true }];
        }

        res["ap-"] = [{ unit: "mrp", cost: -3 }];
      } else {
        res.voltage = [{}];
      }
      return res;
    },
    ignitionTimes: 3,
    draw(stage) {
      if (!stage.ignition) {
        return { mental: [{}] };
      }
    },
    cross(stage, card) {
      let main = card.getMain(stage);
      if (!stage.ignition) {
        if (main == "mental" || main == "protect") {
          stage.trigger({ ignition: 1 });
        }
      }
    },
  },
  {
    short: "ritm吟",
    member: 7,
    cost: 5,
    main: "dress",
    skill: { cards: ["ritm👗1", "ritm👗2", "ritm👗3"] },
    draw: { protect: [{}] },
  },
  {
    short: "ritm👗1",
    member: "dress",
    cost: 1,
    main: "heart",
    once: true,
    skill: { heart: [{}] },
  },
  {
    short: "ritm👗2",
    member: "dress",
    cost: 1,
    main: "voltage",
    once: true,
    skill: { voltage: [{}] },
  },
  {
    short: "ritm👗3",
    member: "dress",
    cost: 1,
    main: "teMax",
    once: true,
  },
  {
    short: "蓝远吟",
    member: 7,
    cost: 3,
    main: "dress",
    skill: { cards: ["蓝远👗", "蓝远👗", "蓝远👗"] },
    cross(stage, card) {
      if (card.unit == "srb") stage.trigger({ voltage: [{}] });
    },
  },
  {
    short: "蓝远👗",
    member: "dress",
    cost: 2,
    main: "reshuffle",
    reshuffle: true,
    once: true,
    skill: { heart: [{}] },
  },
  {
    short: "水母吟",
    member: 7,
    cost: 3,
    main: "dress",
    skill: { cards: ["水母👗", "水母👗", "水母👗"] },
  },
  {
    short: "水母👗",
    member: "dress",
    cost: 3,
    main: "ap",
    once: true,
    skill(stage) {
      let res = {};
      if (stage.getAllCards().length >= 30) {
        res.heart = [{ over: true }];
      }
      return res;
    },
  },
  {
    short: "花结吟",
    member: 7,
    cost: 13,
    teCostDelta(te) {
      let delta = 0;
      for (let c of te) {
        if (c.unit == "srb") delta -= 3;
      }
      return delta;
    },
    main: "dress",
    reshuffle: true,
    skill: {
      cards: [
        "花结👗1",
        "花结👗1",
        "花结👗1",
        "花结👗2",
        "花结👗2",
        "花结👗2",
        "花结👖3",
        "花结👖3",
        "花结👖3",
      ],
    },
    drawFilters: [
      { member: "dress" },
      { member: "dress" },
      { member: "dress" },
      { member: "dress" },
      { member: "dress" },
      { member: "dress" },
      { member: "dress" },
      { member: "dress" },
    ],
  },
  {
    short: "花结👗1",
    member: "dress",
    cost: 3,
    main: "voltage",
    once: true,
    skill(stage) {
      let res = { voltage: [{ over: true, spAp: 9 }] };
      if (stage.getAllCards().length >= 33) {
        res.heart = [{ over: true }];
      }
      return res;
    },
  },
  {
    short: "花结👗2",
    member: "dress",
    cost: 3,
    main: "protect",
    once: true,
    skill(stage) {
      let res = { protect: [{ spAp: 8 }] };
      if (stage.getAllCards().length >= 33) {
        res.heart = [{ over: true }];
      }
      return res;
    },
  },
  {
    short: "花结👖3",
    member: "dress",
    cost: 3,
    main: "reshuffle",
    reshuffle: true,
    once: true,
    skill(stage) {
      let res = {};
      if (stage.getAllCards().length >= 30) {
        return { heart: [{ over: true }] };
      }
      return res;
    },
    drawFilters: [
      { unit: "srb" },
      { unit: "srb" },
      { unit: "srb" },
      { unit: "srb" },
      { unit: "srb" },
      { unit: "srb" },
    ],
  },
  {
    short: "br吟",
    member: 7,
    cost: 3,
    main: "celebration",
  },
  {
    short: "db铃",
    member: 8,
    cost: 5,
    main: "heart",
    skill: { heart: [{}] },
    afterSkill(stage, self) {
      self.costDelta--;
    },
  },
  {
    short: "雪纺铃",
    member: 8,
    cost: 3,
    main: "mental",
    skill: { mental: [{}] },
  },
  {
    short: "bsbd铃",
    member: 8,
    cost: 4,
    main: "heartMax",
  },
  {
    short: "bsbd姬芽",
    member: 9,
    cost: 4,
    reshuffle: true,
    main: "reshuffle",
  },
];
