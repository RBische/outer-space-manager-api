var globalConfig = {
  mineralsGenerated: 0.5,
  gasGenerated: 0.5
}

globalConfig.generateMinerals = function (timeBetweenRefresh, mineralsModifier) {
  return this.mineralsGenerated * mineralsModifier * timeBetweenRefresh
}

globalConfig.generateGas = function (timeBetweenRefresh, gasModifier) {
  return this.gasGenerated * gasModifier * timeBetweenRefresh
}

globalConfig.calculateExecutionTimeForBuilding = function (speedBuilding, level, timeToBuildLevel0, timeToBuildByLevel, buildingId) {
  var executionTime = (timeToBuildByLevel * level + timeToBuildLevel0) * 1000 + Date.now()
  if (speedBuilding !== undefined) {
    console.log('Reduced time by ' + speedBuilding + ' seconds')
    executionTime = executionTime - speedBuilding * 1000
  }
  return executionTime
}

globalConfig.calculateExecutionTimeForSearch = function (speedSearch, level, timeToSearchLevel0, timeToSearchByLevel, searchId) {
  var executionTime = (timeToSearchByLevel * level + timeToSearchLevel0) * 1000 + Date.now()
  if (speedSearch !== undefined) {
    console.log('Reduced time by ' + speedSearch + ' seconds')
    executionTime = executionTime - speedSearch * 1000
  }
  return executionTime
}

module.exports = globalConfig
