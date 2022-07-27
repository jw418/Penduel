const Penduel = artifacts.require("Penduel");
const VRFCoordinatorV2Mock = artifacts.require('VRFCoordinatorV2Mock');

// const deployMocks = (deployer) => {
//   return Promise.all([
//       deployer.deploy(
//           VRFCoordinatorV2Mock,
//           100000, // base fee
//           100000 // gas price link
//       ),
//   ]);
// }

module.exports = async function (deployer) {
  let subscriptionId, vrfCoordinatorAddress;

  if (config.network === 'development') {
      // deploy mocks if network is development
      await deployer.deploy(VRFCoordinatorV2Mock,
        100000,    // base fee
        100000 );  // gas price link
        
      subscriptionId = 1; // mock vrf coordinator creates a subscription with id of 1 at first creation
      vrfCoordinatorAddress = VRFCoordinatorV2Mock.address;
      
  } else {
    // change values depends on your network (rinkeby, kovan etc.)
    await deployer.deploy(VRFCoordinatorV2Mock,
      100000,    // base fee
      100000 );  // gas price link
    
    subscriptionId = 8023;
    vrfCoordinatorAddress = 0x6168499c0cFfCaCD319c818142124B7A15E857ab; //rinkeby
  }

  await deployer.deploy(
      Penduel,
      subscriptionId,
      vrfCoordinatorAddress          
  );
};
