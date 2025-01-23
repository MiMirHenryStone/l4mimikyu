function newIndexList(stage, next) {
  let indexList = [];
  for (let i = 0; i < stage.te.length; i++) {
    if (
      stage.te[i].getCost(stage.te) <= stage.ap + (next ? stage.apSpeed : 0) &&
      stage.testResults[i] >= 0
    )
      indexList.push(i);
  }
  return indexList;
}
function scoreFilter(stage, indexList) {
  let scoreList = indexList.map((index) => stage.testResults[index]);
  let max = Math.max(...scoreList);
  return indexList.filter((index, i) => scoreList[i] == max);
}
function costFilter(stage, indexList, forceNotEmpty) {
  let fullCostScoreList = stage.te.map((c, index) =>
    stage.te[index].getCost(stage.te) > stage.apMax
      ? 0
      : stage.testResults[index] / stage.te[index].getCalcCost(stage)
  );
  let costScoreList = indexList.map((index) => fullCostScoreList[index]);
  let max = Math.max(...costScoreList);
  let m =
    Math.max(
      ...newIndexList(stage, true).map((index) => fullCostScoreList[index])
    ) / 2;
  if (!forceNotEmpty && max <= m && Math.max(...fullCostScoreList) > 0) {
    let mList = indexList.filter((index) => costScoreList[index] >= 0);
    let min = Math.min(
      ...mList.map((index) => stage.te[index].getCost(stage.te))
    );
    if (min <= stage.apSpeed)
      return mList.filter((index) => stage.te[index].getCost(stage.te) == min);
    else return [];
  } else return indexList.filter((index, i) => costScoreList[i] == max);
}
function costSubtractFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => stage.te[index].getSkill(stage)?.["ap-"]
  );
  if (!newList.length) newList = indexList;
  let csList = newList.map((index) => {
    let card = stage.te[index];
    let sa = 0;
    stage.getAllCards().forEach((c) => {
      if (c.props?.draw?.["ap-"])
        sa += card.calcSubtractAp(c.props?.draw?.["ap-"]);
    });
    return sa;
  });
  let min = Math.min(...csList);
  return newList.filter((index, i) => csList[i] == min);
}
// 花结
function drawFilterReshuffleFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => stage.te[index].props?.drawFilters?.length
  );
  if (newList.length) return newList;
  else return indexList;
}
// dress
function dressFilter(stage, indexList) {
  let newList = indexList.filter((index) => stage.te[index].member == "dress");
  if (newList.length) return newList;
  else return indexList;
}
// jewelry
function jewelryFilter(stage, jewelryCountTarget, indexList) {
  let jewelryCount = stage
    .getAllCards()
    .filter((i) => i.member == "jewelry").length;
  if (jewelryCount > jewelryCountTarget) return indexList;
  let newList = indexList.filter(
    (index) => stage.te[index].member != "jewelry"
  );
  if (newList.length) return newList;
  else return indexList;
}

export function strategyPlay(stage, jewelryCountTarget = 8, first) {
  let res;
  let card, index;

  if (first == undefined) {
    first =
      stage.strategy ??
      (stage.sp == "mg2" || stage.sp == "tz2" || stage.sp == "kz2"
        ? "score"
        : "cost");
    if (stage.ap + stage.apSpeed * (stage.apMax / 10) >= stage.apMax) {
      first = "score";
    } else if (
      stage.te.filter(
        (c) => c.getSkill(stage)?.ap < 0 && c.getCost(stage.te) <= stage.ap
      )?.length > 0
    ) {
      first = "score";
    }
  }

  // ignition
  if (
    !stage.ignition &&
    stage.te.find((c) => c.short == "上升姬芽") &&
    stage.te.find(
      (c) =>
        (c.getMain(stage) == "mental" || c.getMain(stage) == "protect") &&
        c.short != "上升姬芽"
    )
  ) {
    if (first == "score") {
      res = scoreFilter(
        stage,
        newIndexList(stage).filter((i) => {
          let c = stage.te[i];
          return (
            (c.getMain(stage) == "mental" ||
              c.getMain(stage) == "protect" ||
              c.getMain(stage) == "ensemble") &&
            c.short != "上升姬芽"
          );
        })
      )[0];
    } else {
      res = costFilter(
        stage,
        newIndexList(stage).filter((i) => {
          let c = stage.te[i];
          return (
            (c.getMain(stage) == "mental" ||
              c.getMain(stage) == "protect" ||
              c.getMain(stage) == "ensemble") &&
            c.short != "上升姬芽"
          );
        }),
        true
      )[0];
    }
  }
  if (res == undefined) {
    // kol慈
    index = stage.te.findIndex((c) => c.short == "kol慈");
    if (
      index >= 0 &&
      stage.getAllCards().filter((c) => c.member == "jewelry").length <
        jewelryCountTarget &&
      (stage.te[index].getCost(stage.te) == 1 ||
        stage.te[index].getCost(stage.te) <
          (first == "score"
            ? stage.ap - stage.apSpeed
            : stage.ap - stage.apSpeed * (stage.apMax / 10)))
    ) {
      res = index;
    }
  }
  if (res == undefined) {
    // jewelry over
    index = stage.te.findIndex(
      (c) =>
        c.member == "jewelry" &&
        stage.hasCostEffect &&
        c.getCost(stage) <= stage.ap
    );
    if (
      index >= 0 &&
      stage.getAllCards().filter((c) => c.member == "jewelry").length >
        jewelryCountTarget
    ) {
      res = index;
    }
  }
  if (res == undefined) {
    if (first == "score") {
      res = drawFilterReshuffleFilter(
        stage,
        jewelryFilter(
          stage,
          jewelryCountTarget,
          scoreFilter(stage, newIndexList(stage))
        )
      )[0];
    } else {
      res = costSubtractFilter(
        stage,
        drawFilterReshuffleFilter(
          stage,
          jewelryFilter(
            stage,
            jewelryCountTarget,
            costFilter(stage, newIndexList(stage))
          )
        )
      )[0];
    }
  }
  // if (newIndexList(stage).length && res == undefined) debugger;
  return res;
}

window.strategyPlay = strategyPlay;
