// Tests pour le Smart contract Penduel.sol
// import des SC
const Penduel = artifacts.require(`Penduel`);
const VRFCoordinatorV2Mock = artifacts.require('VRFCoordinatorV2Mock');

// import chai/test-helpers
const { BN, expectRevert, expectEvent, balance, send, ether,} = require(`@openzeppelin/test-helpers`);
const { expect } = require(`chai`);



contract(`Penduel`, function (accounts) {

  // constant des adresses pour les tests
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const notPlayer = accounts[8];
  const notadmin = accounts[9];

  // variable qui permet de numéroter nos tests 
  var testCounter = 0;   

  const subcriptionId = 8023;
  const subcriptionIdMock = 1;


  // on déploie le contrat avant chaque test
  beforeEach(async function () {
    this.vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.new(1000000, 1000000);
    this.PenduelInstance = await Penduel.new(1, '0x6168499c0cFfCaCD319c818142124B7A15E857ab');
  });


  // on vérifie toutes les variables/constantes de notre contrat 
  context(`###### variable test ######`, () => {
    it(`${testCounter++}: s_subscriptionId must be equal to 1`, async function () {
      const subcriptionId = await this.PenduelInstance.s_subscriptionId();
      await expect(subcriptionId).to.be.bignumber.equal(
        `1`,
        `s_subscriptionId is not 1`
      );
    });

  
  
  
  
  
  
  
  
  
  
  }); 





}); 

//     it(`${testCounter++}: giftLimit must be equal to 33`, async function () {
//       const maxSupply = await this.PenduelInstance.giftLimit();
//       await expect(maxSupply).to.be.bignumber.equal(
//         `33`,
//         `giftLimit is not 33`
//       );
//     });

//     it(`${testCounter++}: min_qty_mint_allowed must be equal to 1`, async function () {
//       const maxSupply = await this.PenduelInstance.min_qty_mint_allowed();
//       await expect(maxSupply).to.be.bignumber.equal(
//         `1`,
//         `min_qty_mint_allowed is not 1`
//       );
//     });

//     it(`${testCounter++}: max_qty_mint_allowed must be equal to 6`, async function () {
//       const maxSupply = await this.PenduelInstance.max_qty_mint_allowed();
//       await expect(maxSupply).to.be.bignumber.equal(
//         `6`,
//         `max_qty_mint_allowed is not 6`
//       );
//     });
