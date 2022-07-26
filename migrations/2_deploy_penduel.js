const Penduel = artifacts.require("Penduel");

module.exports = function (deployer) {
  deployer.deploy(Penduel);
};
