function newIndexList(stage) {
  let indexList = [];
  for (let i = 0; i < stage.te.length; i++) {
    if (stage.te[i].getCost() <= stage.apMax) indexList.push(i);
  }
  return indexList;
}
function scoreFilter(stage, indexList) {
  let scoreList = indexList.map((index) => stage.testCard(index));
  let max = Math.max(...scoreList);
  return indexList.filter((index, i) => scoreList[i] == max);
}
function costFilter(stage, indexList) {
  let costList = indexList.map((index) => stage.te[index].getCost(true));
  let min = Math.min(...costList);
  return indexList.filter((index, i) => costList[i] == min);
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
  let max = Math.max(...reshuffleProbabilityList);
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
// dress
function dressFilter(stage, indexList) {
  let newList = indexList.filter((index) => stage.te[index].member == "dress");
  if (newList.length) return newList;
  else return indexList;
}
function addDressFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => stage.te[index].getMain(stage) != "dress"
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
function jewelryFilter(stage, indexList) {
  let newList = indexList.filter(
    (index) => stage.te[index].member != "jewelry"
  );
  if (newList.length) return newList;
  else return indexList;
}

export function strategyPlay(stage, jewelryCountTarget = 9, first = "score") {
  let res;
  let card, index;

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
    if (first == "cost")
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
  } else {
    // jewelry
    index = stage.te.findIndex((c) => c.short == "kol慈");
    if (
      index >= 0 &&
      stage.getAllCards().filter((c) => c.member == "jewelry").length <
        jewelryCountTarget &&
      stage.te[index].getCost(true) < (first == "score" ? stage.apMax : 10)
    ) {
      res = index;
    }
    // reshuffle
    else if (
      newIndexList(stage).find((i) => stage.te[i].isReshuffle(stage)) !=
      undefined
    ) {
      let indexList = newIndexList(stage).filter((i) =>
        stage.te[i].isReshuffle(stage)
      );
      if (first == "cost")
        res = costSubtractFilter(
          stage,
          drawFilterReshuffleFilter(
            stage,
            ignitionReshuffleFilter(
              stage,
              scoreFilter(
                stage,
                costFilter(
                  stage,
                  addDressFilter(
                    stage,
                    dressFilter(stage, yamaReshuffleFilter(stage, indexList))
                  )
                )
              )
            )
          )
        )[0];
      else
        res = drawFilterReshuffleFilter(
          stage,
          scoreFilter(
            stage,
            ignitionReshuffleFilter(
              stage,
              addDressFilter(
                stage,
                dressFilter(stage, yamaReshuffleFilter(stage, indexList))
              )
            )
          )
        )[0];
    } else if (first == "cost") {
      res = costSubtractFilter(
        stage,
        scoreFilter(
          stage,
          costFilter(
            stage,
            drawFilterSingleFilter(
              stage,
              jewelryFilter(
                stage,
                addDressFilter(stage, dressFilter(stage, newIndexList(stage)))
              )
            )
          )
        )
      )[0];
    } else {
      res = scoreFilter(
        stage,
        drawFilterSingleFilter(
          stage,
          jewelryFilter(
            stage,
            addDressFilter(stage, dressFilter(stage, newIndexList(stage)))
          )
        )
      )[0];
    }
  }
  if (res == undefined) debugger;
  return res;
}
