function newIndexList(stage, next) {
  let indexList = [];
  for (let i = 0; i < stage.te.length; i++) {
    if (
      stage.te[i].getCost(stage.te, stage.ignition) <=
        stage.ap + (next ? stage.apSpeed : 0) &&
      (stage.strategy == "heartMax"
        ? !stage.te[i].getSkill(stage)?.cards ||
          stage.te[i].short == stage.targetCard0
        : stage.testResults[i] >= 0)
    )
      indexList.push(i);
  }
  return indexList;
}
function costFilter(stage, indexList) {
  let costList = indexList.map((index) =>
    stage.te[index].getCost(stage.te, stage.ignition)
  );
  let min = Math.min(...costList);
  return indexList.filter((index, i) => costList[i] == min);
}
function scoreFilter(stage, indexList) {
  let scoreList = indexList.map((index) => stage.testResults[index]);
  let max = Math.max(...scoreList);
  return indexList.filter((index, i) => scoreList[i] == max);
}
function costScoreFilter(stage, indexList, forceNotEmpty) {
  let fullCostScoreList = stage.te.map((c, index) =>
    stage.te[index].getCost(stage.te, stage.ignition) > stage.apMax
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
      ...mList.map((index) => stage.te[index].getCost(stage.te, stage.ignition))
    );
    if (min <= stage.apSpeed)
      return mList.filter(
        (index) => stage.te[index].getCost(stage.te, stage.ignition) == min
      );
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
// reshuffle
function reshuffleFilter(stage, indexList) {
  let newList = indexList.filter((index) => stage.te[index].isReshuffle(stage));
  if (newList.length) return newList;
  else {
    let newList = newIndexList(stage, true).filter((index) =>
      stage.te[index].isReshuffle(stage)
    );
    if (newList.length) return [];
    else return indexList;
  }
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
    .filter((c) => c.short == stage.targetCard1).length;
  if (jewelryCount > jewelryCountTarget) return indexList;
  let newList = indexList.filter(
    (index) => stage.te[index].short != stage.targetCard1
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
    if (stage.strategy != "heartMax") {
      if (stage.ap + stage.apSpeed * (stage.apMax / 10) >= stage.apMax) {
        first = "score";
      } else if (
        stage.te.filter(
          (c) =>
            c.getSkill(stage)?.ap < 0 &&
            c.getCost(stage.te, stage.ignition) <= stage.ap
        )?.length > 0
      ) {
        first = "score";
      }
    }
  }

  // ignition
  if (
    !stage.ignition &&
    stage.te.find((c) => c.short.match(/^上升/)) &&
    stage.te.find(
      (c) =>
        (c.getMain(stage) == "mental" || c.getMain(stage) == "protect") &&
        (stage.hasIgnitionCard ? c.short != "上升姬芽" : true)
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
            (stage.hasIgnitionCard ? c.short != "上升姬芽" : true)
          );
        })
      )[0];
    } else if (first == "cost") {
      res = costScoreFilter(
        stage,
        newIndexList(stage).filter((i) => {
          let c = stage.te[i];
          return (
            (c.getMain(stage) == "mental" ||
              c.getMain(stage) == "protect" ||
              c.getMain(stage) == "ensemble") &&
            (stage.hasIgnitionCard ? c.short != "上升姬芽" : true)
          );
        }),
        true
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
            (stage.hasIgnitionCard ? c.short != "上升姬芽" : true)
          );
        }),
        true
      )[0];
    }
  }
  if (res == undefined) {
    // kol慈
    index = stage.te.findIndex((c) => c.short == stage.targetCard0);
    if (
      index >= 0 &&
      stage.getAllCards().filter((c) => c.short == stage.targetCard1).length <
        jewelryCountTarget &&
      (stage.te[index].getCost(stage.te, stage.ignition) == 1 ||
        stage.te[index].getCost(stage.te, stage.ignition) <
          (first == "score"
            ? stage.ap - stage.apSpeed
            : first == "heartMax"
            ? stage.ap
            : stage.ap - stage.apSpeed * (stage.apMax / 10)))
    ) {
      res = index;
    }
  }
  if (res == undefined) {
    // jewelry over
    index = stage.te.findIndex(
      (c) =>
        c.short == stage.targetCard1 &&
        stage.hasCostEffect &&
        c.getCost(stage, stage.ignition) <= stage.ap
    );
    if (
      index >= 0 &&
      stage.getAllCards().filter((c) => c.short == stage.targetCard1).length >
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
    } else if (first == "heartMax") {
      res = costSubtractFilter(
        stage,
        drawFilterReshuffleFilter(
          stage,
          costFilter(
            stage,
            reshuffleFilter(
              stage,
              jewelryFilter(stage, jewelryCountTarget, newIndexList(stage))
            )
          )
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
            costScoreFilter(stage, newIndexList(stage))
          )
        )
      )[0];
    }
  }
  // if (newIndexList(stage).length && res == undefined) debugger;
  return res;
}

window.strategyPlay = strategyPlay;
