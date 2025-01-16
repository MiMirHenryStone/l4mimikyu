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

  getCost(te = false) {
    let cost = this.cost;
    cost += this.costDelta;
    if (te && this.props?.teCostDelta) cost += this.props?.teCostDelta(te);
    if (te) cost += this.teCostDelta;
    return cost >= 1 ? cost : 1;
  }

  getCalcCost(stage) {
    let skill = this.getSkill(stage);
    let cost = this.getCost(stage.te);
    let calcCost = cost;
    calcCost -= skill?.ap ?? 0;
    calcCost -= skill?.spAp ?? 0;

    if (calcCost < 1 || (calcCost >= stage.apMax && cost <= stage.ap))
      calcCost = 1;
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
    n += draw?.heart || 0;
    if (stage.sp == "tz") n += draw?.voltage || 0;
    if (stage.sp == "mg2") n += (draw?.mental || 0) + (draw?.protect || 0);

    if (!stage.te.includes(this) && this.getCalcCost(stage) >= stage.apMax) {
      let m = 0;
      let skill = this.getSkill(stage);
      m += skill.heart || 0;
      if (stage.sp == "tz") m += skill?.voltage || 0;
      if (stage.sp == "mg2") m += (skill?.mental || 0) + (skill?.protect || 0);
      let turn = stage.getAllCards().length / stage.teMax;
      n += (m / (turn + 1)) * turn;
    }
    return n;
  }

  onCross(stage, card, main) {
    if (this.props?.cross) this.props.cross(stage, card, main, this);
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
    skill: { mental: 1, voltage: 1 },
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
    skill: { voltage: 1, mental: -1 },
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
      let res = { mental: 1, protect: 1 };
      if (stage.ignition) {
        res["ap-"] = [{ unit: "mrp", cost: -3 }];
      }
      return res;
    },
    ignitionTimes: 3,
    // afterSkill(stage) {
    //   if (stage.ignition) {
    //     stage.ignitionTimesDict[this.short]++;
    //     if (stage.ignitionTimesDict[this.short] >= 3) {
    //       stage.ignition = false;
    //       stage.ignitionTimesDict[this.short] = undefined;
    //     }
    //   }
    // },
    cross(stage, card, main) {
      if (!stage.ignition) {
        if (main == "mental" || main == "protect") {
          stage.ignition = true;
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
    skill: { protect: 1 },
  },
  {
    short: "织姬花帆",
    member: 1,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: 1 },
  },
  {
    short: "音击花帆",
    member: 1,
    cost: 9,
    main: "heart",
    reshuffle: true,
    yamaReshuffle: true,
    skill: { heart: 3 },
    draw: { heart: 1, mental: 1 },
  },
  {
    short: "lttf沙耶",
    member: 2,
    cost: 5,
    main: "voltage",
    skill: { voltage: 1 },
    drawFilters: [{ member: 6 }],
  },
  {
    short: "沏茶瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { voltage: 1 },
    draw: { heart: 1 },
  },
  {
    short: "蛋糕瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { heart: 1 },
    draw: { heart: 1 },
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
    cross(stage, card, main, self) {
      if (card.unit == "srb") {
        stage.trigger({ heart: 1 });
        self.teCostDelta -= 3;
      }
    },
  },
  {
    short: "kol梢",
    member: 3,
    cost: 9,
    main: "mental",
    skill: { mental: 1, heart: 1 },
    draw: { "ap-": [{ member: 6, cost: -9 }] },
    cross(stage, card) {
      if (card.member == 6) stage.trigger({ protect: 1, heart: 1 });
    },
  },
  {
    short: "自由缀",
    member: 4,
    cost: 10 - 8,
    main: "mental",
    skill: { mental: 1, heart: 1 },
    draw: (stage) => {
      let res = {};
      if (stage.mental) res = { heart: 1 };
      return res;
    },
  },
  {
    short: "kol缀",
    member: 4,
    cost: 3,
    main: "voltage",
    skill: { voltage: 1, heart: 1 },
    draw: {
      "ap-": [
        { member: 3, cost: -3 },
        { member: 6, cost: -3 },
      ],
    },
    cross(stage, card) {
      if (card.member == 6) stage.trigger({ voltage: 1, heart: 1 });
    },
  },
  {
    short: "af慈",
    member: 6,
    cost: 9,
    main: "protect",
    skill(stage) {
      let res = { protect: 1, heart: 10, ap: -Infinity };
      if (stage.sp == "mg2") {
        res.heart = 9;
        res.spAp = 17 - 2;
      }
      return res;
    },
  },
  {
    short: "kol慈",
    member: 6,
    cost: 39,
    main: "heart",
    skill: { heart: 2, cards: ["💎"] },
    cross(stage, card, main, self) {
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
    draw: { heart: 1, voltage: 1, protect: 1 },
  },
  {
    short: "舞会缀",
    member: 4,
    cost: 7 - 5,
    main: "voltage",
    skill: { voltage: 1 },
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
  //   skill: { heart: 2 },
  // },
  {
    short: "银河缀",
    member: 4,
    cost: 5 - 3,
    main: "voltage",
    skill(stage) {
      let res = { voltage: 1, heart: 1 };
      if (stage.sp == "tz2") res.spAp = 6 - 1;
      return res;
    },
  },
  {
    short: "银河慈",
    member: 6,
    cost: 5,
    main: "reshuffle",
    reshuffle: true,
    skill(stage) {
      let res = { mental: 2, protect: 1 };
      if (stage.sp == "mg2") res.spAp = 20;
      return res;
    },
  },
  {
    short: "讴歌梢",
    member: 3,
    cost: 5 - 2,
    main: "love+",
    draw: { heart: 1 },
  },
  {
    short: "ritm梢",
    member: 3,
    cost: 5 - 3,
    main: "voltage",
    skill: { voltage: 1 },
    draw: { mental: 1 },
  },
  {
    short: "秋色梢",
    member: 3,
    cost: 6,
    main: "love+",
    draw: { mental: 1 },
  },
  {
    short: "自由梢",
    member: 3,
    cost: 8 - 6,
    main: "protect",
    skill: { protect: 1 },
    draw: (stage) => {
      let res = {};
      if (stage.mental) res = { protect: 1 };
      return res;
    },
  },
  {
    short: "教师梢",
    member: 3,
    cost: 2,
    main: "heart",
    skill: { heart: 1, mental: -1 },
    draw: { mental: 1 },
  },
  {
    short: "水母梢",
    member: 3,
    cost: 5,
    main: "love+",
    draw: { cards: ["⚪"] },
  },
  {
    short: "⚪",
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
    short: "ss缀",
    member: 4,
    cost: 5 - 2,
    main: "heart",
    skill: { heart: 1 },
    draw: { voltage: 1 },
  },
  {
    short: "雨伞缀",
    member: 4,
    cost: 5,
    main: "love+",
    draw: { heart: 1 },
  },
  {
    short: "花火缀",
    member: 4,
    cost: 3,
    main: "voltage",
    skill: { voltage: 1 },
    draw: { voltage: 1 },
  },
  {
    short: "秋色缀",
    member: 4,
    cost: 6,
    main: "heart",
    skill: (stage) => {
      let res = {};
      if (stage.mental) res = { heart: 3 };
      else res = { heart: 2 };
      return res;
    },
    draw: { mental: 1 },
  },
  {
    short: "抱花缀",
    member: 4,
    cost: 4,
    main: "voltage",
    skill: { voltage: 1 },
    draw: { voltage: 1 },
  },
  {
    short: "音击缀",
    member: 4,
    cost: 9,
    main: "voltage",
    skill: { voltage: 1, heart: 3 },
    draw: { voltage: 1, protect: 1 },
  },
  {
    short: "af缀",
    member: 4,
    cost: 9,
    main: "voltage",
    skill(stage) {
      let res = { voltage: 2, heart: 10, ap: -Infinity };
      if (stage.sp == "tz") res.heart = 9;
      if (stage.sp == "tz2") res.spAp = 20;
      return res;
    },
  },
  {
    short: "蛋糕慈",
    member: 6,
    cost: 4,
    main: "mental",
    skill: { mental: 1 },
    draw: { mental: 1, protect: 1 },
  },
  {
    short: "舞会慈",
    member: 6,
    cost: 3,
    main: "love+",
    yamaUse: true,
    skill: { mental: -1 },
    draw: { mental: 1 },
  },
  {
    short: "圣诞慈",
    member: 6,
    cost: 4,
    main: "mental",
    skill: { mental: 3 },
    draw: { mental: 1 },
  },
  {
    short: "抱花慈",
    member: 6,
    cost: 4,
    main: "protect",
    skill: { protect: 1 },
    draw: { protect: 1 },
  },
  {
    short: "hsct慈",
    member: 6,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
  },
  {
    short: "ritm花帆",
    member: 1,
    cost: 4 - 3,
    main: "heart",
    skill: { heart: 1 },
    draw: { mental: 1 },
  },
  {
    short: "讴歌花帆",
    member: 1,
    cost: 5 - 2,
    main: "mental",
    skill: { mental: 1 },
    draw: { voltage: 1 },
  },
  {
    short: "雨伞花帆",
    member: 1,
    cost: 3,
    main: "voltage",
    skill: { voltage: 1 },
    draw: { mental: 1 },
  },
  {
    short: "自由花帆",
    member: 1,
    cost: 6 - 4,
    main: "voltage",
    skill: { voltage: 1, heart: 1 },
    draw: (stage) => {
      let res = {};
      if (stage.mental) res = { voltage: 1 };
      return res;
    },
  },
  {
    short: "舞会花帆",
    member: 1,
    cost: 6,
    main: "heart",
    skill: { heart: 1 },
  },
  {
    short: "偶活花帆",
    member: 1,
    cost: 9,
    main: "heart",
    reshuffle: true,
    skill: { heart: 1 },
    cross(stage, card, main, self) {
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
    skill: { mental: 1, voltage: 1 },
    draw: { mental: 1, heart: 1 },
  },
  {
    short: "雨伞沙耶",
    member: 2,
    cost: 4,
    main: "mental",
    skill: { mental: 1 },
    draw: { voltage: 1 },
  },
  {
    short: "tc沙耶",
    member: 2,
    cost: 3,
    main: "love+",
    skill: { mental: -1 },
    draw: { voltage: 1 },
  },
  {
    short: "宇宙沙耶",
    member: 2,
    cost: 4,
    main: "teMax",
    skill: { voltage: 1 },
  },
  {
    short: "沏茶沙耶",
    member: 2,
    cost: 2,
    main: "love+",
    skill: { voltage: 1 },
  },
  {
    short: "圣诞沙耶",
    member: 2,
    cost: 4,
    main: "voltage",
    skill: { voltage: 1, heart: 2 },
    draw: { voltage: 1 },
  },
  {
    short: "db瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { voltage: 1 },
    draw: { voltage: 1 },
  },
  {
    short: "梦境瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { heart: 1 },
  },
  {
    short: "rod瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: 1 },
    draw: { mental: 1 },
  },
  {
    short: "一专瑠璃",
    member: 5,
    cost: 5,
    main: "reshuffle",
    reshuffle: true,
    skill: { heart: 1 },
  },
  {
    short: "abdl瑠璃",
    member: 5,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: 1 },
  },
  {
    short: "白昼瑠璃",
    member: 5,
    cost: 3,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: -1 },
    draw: { heart: 1 },
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
        res = { heart: 1 };
      } else {
        res = { ap: 1 };
      }
      return res;
    },
  },
  {
    short: "ritm吟",
    member: 7,
    cost: 5,
    main: "dress",
    skill: { cards: ["ritm👗1", "ritm👗2", "ritm👗3"] },
    draw: { protect: 1 },
  },
  {
    short: "ritm👗1",
    member: "dress",
    cost: 1,
    main: "heart",
    once: true,
    skill: { heart: 1 },
  },
  {
    short: "ritm👗2",
    member: "dress",
    cost: 1,
    main: "voltage",
    once: true,
    skill: { voltage: 1 },
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
      if (card.unit == "srb") stage.trigger({ voltage: 1 });
    },
  },
  {
    short: "蓝远👗",
    member: "dress",
    cost: 2,
    main: "reshuffle",
    reshuffle: true,
    once: true,
    skill: { heart: 1 },
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
      let res = { voltage: 2 };
      if (stage.getAllCards().length >= 33) {
        if (stage.sp == "tz2") res.heart = 1;
        else res.heart = 2;
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
      let res = { protect: 1 };
      if (stage.getAllCards().length >= 33) {
        if (stage.sp == "mg2") res.heart = 1;
        else res.heart = 2;
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
      if (stage.getAllCards().length >= 30) {
        return { heart: 2 };
      }
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
    short: "db铃",
    member: 8,
    cost: 5,
    main: "heart",
    skill: { heart: 1 },
    afterSkill(stage, self) {
      self.costDelta--;
    },
  },
  {
    short: "雪纺铃",
    member: 8,
    cost: 3,
    main: "mental",
    skill: { mental: 1 },
  },
];
