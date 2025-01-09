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
      this.teCostDelta = 0;
    }
  }

  copy() {
    let newCard = new Card(this.short);
    newCard.cost = this.cost;
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
    if (te) cost += this.teCostDelta;
    return cost >= 1 ? cost : 1;
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

  onSkill(stage) {
    if (this.props?.skill) {
      if (typeof this.props.skill == "function") {
        this.props.skill(stage);
      } else {
        stage.trigger(this.props.skill);
      }
    }
  }

  afterSkill(stage) {
    if (this.props?.afterSkill) {
      this.props.afterSkill(stage);
    }
  }

  onDraw(stage) {
    this.teCostDelta = 0;
    if (this.props?.draw) {
      if (typeof this.props.draw == "function") {
        this.props.draw(stage, this);
      } else {
        stage.trigger(this.props.draw);
      }
    }
  }

  onCross(stage, card) {
    if (this.props?.cross) this.props.cross(stage, card, this);
  }
}

export const schoolIdol = [
  // { member: 0, short: "st", year: 101, unit: "" },
  { member: 3, short: "kz", year: 102, unit: "srb" },
  { member: 4, short: "td", year: 102, unit: "drk" },
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
    skill(stage) {
      for (let i = 0; i < 5; i++) stage.yama.push(new Card("圣夜👗"));
    },
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
    short: "lttf铃",
    member: 8,
    cost: 9,
    main: "voltage",
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
    skill: { mental: 1, protect: 1 },
    afterSkill(stage) {
      if (stage.ignition) {
        if (stage.timesDict[this.short] == undefined)
          stage.timesDict[this.short] = 0;
        else stage.timesDict[this.short]++;
        if (stage.timesDict[this.short] >= 3) {
          stage.ignition = false;
          stage.timesDict[this.short] = undefined;
        }

        stage.getAllCards().forEach((c) => {
          if (c.unit == "mrp") c.cost -= 3;
        });
      }
    },
    cross(stage, card) {
      if (!stage.ignition) {
        let main = card.getMain(stage);
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
    cross(stage, card, self) {
      if (card.unit == "srb") {
        stage.trigger({ heart: 1 });
        self.teCostDelta -= 3;
      }
    },
    afterSkill(stage) {
      stage.getAllCards().forEach((c) => {
        if (c.unit == "srb" || c.member == "dress") c.cost -= 3;
      });
    },
  },
  {
    short: "kol梢",
    member: 3,
    cost: 9,
    main: "mental",
    skill: { mental: 1, heart: 1 },
    draw(stage) {
      stage.getAllCards().forEach((c) => {
        if (c.member == 6) c.cost -= 9;
      });
    },
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
    draw: { heart: 1 },
  },
  {
    short: "银河慈",
    member: 6,
    cost: 5,
    main: "reshuffle",
    reshuffle: true,
    skill: { mental: 2, protect: 1 },
  },
  {
    short: "kol慈",
    member: 6,
    cost: 39,
    main: "heart",
    skill: { heart: 2 },
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
    afterSkill(stage) {
      stage.yama.push(new Card("💎"));
    },
  },
  {
    short: "💎",
    member: "jewelry",
    cost: 1,
    main: "ap-",
    once: true,
    draw: { heart: 1, voltage: 1, protect: 1 },
  },
  {
    short: "pa吟",
    member: 7,
    cost: 4,
    main: "dress",
    skill(stage) {
      for (let i = 0; i < 2; i++) stage.yama.push(new Card("pa吟👗"));
    },
  },
  {
    short: "pa吟👗",
    member: "dress",
    cost: 2,
    main: "ap",
    once: true,
  },
  {
    short: "kol缀",
    member: 4,
    cost: 3,
    main: "voltage",
    skill: { voltage: 1, heart: 1 },
    draw(stage) {
      stage.getAllCards().forEach((c) => {
        if (c.member == 3 || c.member == 6) c.cost -= 3;
      });
    },
    cross(stage, card) {
      if (card.member == 6) stage.trigger({ voltage: 1, heart: 1 });
    },
  },
  {
    short: "hsct慈",
    member: 6,
    cost: 4,
    main: "reshuffle",
    reshuffle: true,
  },
  {
    short: "舞会缀",
    member: 4,
    cost: 2,
    main: "voltage",
    skill: { voltage: 1 },
  },
  {
    short: "舞会沙耶",
    member: 2,
    cost: 2,
    main: "love+",
  },
];
