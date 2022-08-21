

const Penduel = artifacts.require("Penduel");

module.exports = async function (deployer) {
  let vrfSubscriptionId = 8023;
  await deployer.deploy(
    Penduel,
    vrfSubscriptionId,                
);
};

const MockPenduel = artifacts.require("MockPenduel");



module.exports = async function (deployer) {

  await deployer.deploy(MockPenduel);
};


// const VRFCoordinatorV2Mock = artifacts.require('VRFCoordinatorV2Mock');
// const MockV3Aggregator = artifacts.require('MockV3Aggregator');


// const deployMocks = (deployer) => {
//   return Promise.all([
//       deployer.deploy(
//           VRFCoordinatorV2Mock,
//           100000, // base fee
//           100000 // gas price link
//       ),
//       deployer.deploy(
//           MockV3Aggregator,
//           18, // decimals
//           207810000000 // initial price feed
//       )
//   ]);
// }

// module.exports = async function (deployer) {
 
//   let vrfCoordinatorAddress, vrfSubscriptionId, priceFeedAddress;

//   if (config.network === 'development') {
//       // deploy mocks if network is development     
//       await deployMocks(deployer);
//       vrfCoordinatorAddress = VRFCoordinatorV2Mock.address;
     
//       vrfSubscriptionId = 1; // mock vrf coordinator creates a subscription with id of 1 at first creation      
//       priceFeedAddress = MockV3Aggregator.address;
      
//   } else {
//     // change values depends on your network (rinkeby, kovan etc.) 
//     vrfCoordinatorAddress = '0x6168499c0cFfCaCD319c818142124B7A15E857ab';        // Rinkeby coordinator  
//     vrfSubscriptionId = 8023;   
//   }

//   await deployer.deploy(
//       Penduel,
//       vrfCoordinatorAddress,
//       vrfSubscriptionId,   
//       priceFeedAddress,             
//   );
//};

