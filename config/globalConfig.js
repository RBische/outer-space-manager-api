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

module.exports = globalConfig
