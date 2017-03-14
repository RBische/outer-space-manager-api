var globalConfig = {
  mineralsGenerated: 0.8,
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

globalConfig.calculateExecutionTimeForShip = function (speedCreation, amount, timeToBuild, searchId) {
  var executionTime = timeToBuild * amount * 1000
  if (speedCreation !== undefined) {
    console.log('Reduced time by ' + (1 - (1 / (speedCreation || 1))) * 100 + ' %')
    executionTime = executionTime * (1 / ((speedCreation / 25) || 1))
  }
  return executionTime + Date.now()
}

globalConfig.calculatePointsForUser = function (minerals, gas) {
  return Math.abs(minerals) + Math.abs(gas) * 1.1
}

globalConfig.calculatePointsWithFleetForUser = function (minerals, gas) {
  return Math.abs(minerals) + Math.abs(gas) * 1.1
}

globalConfig.getDistanceFromUsers = function (user1, user2) {
  return Math.abs(user1.points - user2.points) * 2000
}

module.exports = globalConfig
