var EthSender = artifacts.require("./EthSender.sol");

module.exports = function (deployer) {
  deployer.deploy(EthSender);
};
