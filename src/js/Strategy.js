function newIndexList(stage) {
  let indexList = [];
  for (let i = 0; i < stage.te.length; i++) {
    if (stage.te[i].getCost(true) <= stage.ap) indexList.push(i);
  }
  return indexList;
}
function scoreFilter(stage, indexList) {
  let scoreList = indexList.map((index) => stage.testCard(index));
  let max = Math.max(...scoreList);
  if (max == 0) return drawFilterSingleFilter(stage, indexList);
  return indexList.filter((index, i) => scoreList[i] == max);
}
function costFilter(stage, indexList) {
  let fullCostScoreList = stage.te.map(
    (c, index) => stage.testCard(index) / stage.te[index].getCost(true)
  );
  let costScoreList = indexList.map((index) => fullCostScoreList[index]);
  let max = Math.max(...costScoreList);
  if (max == 0 && Math.max(...fullCostScoreList) > 0) {
    let min = Math.min(
      ...indexList.map((index) => stage.te[index].getCost(true))
    );
    if (min <= stage.apSpeed)
      return indexList.filter((index) => stage.te[index].getCost(true) == min);
    else return drawFilterSingleFilter(stage, indexList);
  } else return indexList.filter((index, i) => costScoreList[i] == max);
}
function costSubtractFilter(stage, indexList) {
  let csList = indexList.map((index) => {
    let card = stage.te[index];
    let sa = 0;
    stage.getAllCards().forEach((c) => {
      if (c.props?.draw?.["ap-"])
        sa += card.calcSubtractAp(c.props?.draw?.["ap-"]);
    });
    return sa;
  });
  let min = Math.min(...csList);
  return indexList.filter((index, i) => csList[i] == min);
}
// lttf
function drawFilterSingleFilter(stage, indexList) {
  let yama = stage.getDrawYama();
  let reshuffleProbabilityList = indexList.map((index) => {
    let card = stage.te[index];
    let results = yama;
    if (card.props?.drawFilters) {
      let drawFilter = card.props?.drawFilters[0];
      results = yama.filter((c) =>
        Object.keys(drawFilter).every((key) => c[key] == drawFilter[key])
      );
      if (!results.length) results = yama;
    }
    return results.filter((c) => c.isReshuffle(stage)).length / results.length;
  });
  // let standard = yama.filter((c) => c.isReshuffle(stage)).length / yama.length;
  let max = Math.max(...reshuffleProbabilityList);
  // if (max <= standard) return [];
  return indexList.filter((index, i) => reshuffleProbabilityList[i] == max);
}
// 花结
function drawFilterReshuffleFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => stage.te[index].props?.drawFilters?.length
  );
  if (newList.length) return newList;
  else return indexList;
}
// 音击
function yamaReshuffleFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => stage.te[index].props?.yamaReshuffle
  );
  if (newList.length) return newList;
  else return indexList;
}
// mental
function mentalFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => !(stage.te[index].props?.skill?.mental < 0)
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
function addDressFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => !stage.te[index].props?.skill?.cards
  );
  if (newList.length) return newList;
  else return indexList;
}
// 上升
function ignitionReshuffleFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => typeof stage.te[index].props?.reshuffle != "function"
  );
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
    if (first != "score")
      res = scoreFilter(
        stage,
        costFilter(
          stage,
          newIndexList(stage).filter((i) => {
            let c = stage.te[i];
            return (
              (c.getMain(stage) == "mental" || c.getMain(stage) == "protect") &&
              c.short != "上升姬芽"
            );
          })
        )
      )[0];
    else
      res = scoreFilter(
        stage,
        newIndexList(stage).filter((i) => {
          let c = stage.te[i];
          return (
            (c.getMain(stage) == "mental" || c.getMain(stage) == "protect") &&
            c.short != "上升姬芽"
          );
        })
      )[0];
  }
  if (res == undefined) {
    // jewelry
    index = stage.te.findIndex((c) => c.short == "kol慈");
    if (
      index >= 0 &&
      stage.getAllCards().filter((c) => c.member == "jewelry").length <
        jewelryCountTarget &&
      stage.te[index].getCost(true) <
        (first == "score" ? stage.ap : stage.ap + stage.apSpeed - 4)
    ) {
      res = index;
    }
  }
  if (res == undefined) {
    // jewelry over
    index = stage.te.findIndex(
      (c) => c.member == "jewelry" && c.getCost(true) == 2
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
    // let hasReshuffle = stage.te.find((i) => i.isReshuffle(stage));
    if (first != "score") {
      res = costSubtractFilter(
        stage,
        drawFilterReshuffleFilter(
          stage,
          jewelryFilter(
            stage,
            jewelryCountTarget,
            addDressFilter(
              stage,
              costFilter(
                stage,
                mentalFilter(stage, dressFilter(stage, newIndexList(stage)))
              )
            )
          )
        )
      )[0];
    } else {
      res = drawFilterReshuffleFilter(
        stage,
        jewelryFilter(
          stage,
          jewelryCountTarget,
          addDressFilter(
            stage,
            scoreFilter(stage, dressFilter(stage, newIndexList(stage)))
          )
        )
      )[0];
    }
  }
  if (newIndexList(stage).length && res == undefined) debugger;
  return res;
}

window.strategyPlay = strategyPlay;
