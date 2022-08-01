// tentative de test avec chainlink
// import des SC
const Penduel = artifacts.require(`Penduel`);
const VRFCoordinatorV2Mock = artifacts.require('VRFCoordinatorV2Mock');
const MockV3Aggregator = artifacts.require('MockV3Aggregator');
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
  var testCounter = 1;   

  const betSize = ether('0.00005');

  let vrfCoordinatorV2Mock;


  // on déploie le contrat avant chaque test
  beforeEach(async function () {
    await MockV3Aggregator.deployed();  
    vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deployed();
    this.PenduelInstance = await Penduel.deployed();   
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

    it(`${testCounter++}: callbackGasLimit must be equal to 10000`, async function () {
      const callbackGasLimit = await this.PenduelInstance.callbackGasLimit();
      await expect(callbackGasLimit).to.be.bignumber.equal(
        `100000`,
        `callbackGasLimit is not 10000`
      );
    });


    // it(`${testCounter++}: vrfCoordinatorAddress must be correctly changed`, async function () {
    //   const vrfCoordinator = await this.PenduelInstance.vrfCoordinatorAddress();      
    //   await expect(vrfCoordinator).to.be.equal(
    //     vrfCoordinatorV2Mock,
    //     `vrfCoordinatoradress is not correctly changed`
    //   );
    // });
    
    it(`${testCounter++}: join session New word`, async function () {
      this.receipt = await this.PenduelInstance.createSession({from:player1, value:betSize});
      this.before = await balance.tracker(player2);

      await this.PenduelInstance.openJoinSessionFct({from: owner});

      await this.PenduelInstance.joinSession('1', {from:player2, value:betSize});
      const struct = await this.PenduelInstance.getsStructPartOne('1', {from: owner});
      console.log(struct);

    });

    // it(`${testCounter++}:should return random words`, async function() {
    //   // we have to create a subscription for the vrf coordinator
    //   // at first creation the subscription id is 1 as we passed in the deploy script
    //   const subscriptionTx = await vrfCoordinatorV2Mock.createSubscription();
    //   const subId = subscriptionTx.logs[0].args.subId;

    //   // we have to fund the subscription to be able to request random words
    //   await vrfCoordinatorV2Mock.fundSubscription(subId, web3.utils.toWei('1', 'ether'));

    //   // this will run when Mock contract's fulfillRandomWords function is called
    //   // which is the event that we fired from there
    //   this.PenduelInstance.RandomWordsTaken().on('data', (event) => {
    //       const { randomWords } = event.returnValues;

    //       // assert if the random words are an array and element at 0 is bigger than 0
    //       assert.isTrue(randomWords.length > 0);
    //       assert.isTrue(randomWords[0] > 0);
    //   });
      
    //   // reason we are making this a promise is that we have to wait until 
    //   // RandomWordsRequested called and then also wait for fulfillRandomWords transaction
    //   // after all this we resolve the promise otherwise test will be done
    //   // and skip to next one immediately after mock.getRandomWords() called
    //   const getRandomWords = () => {
    //       return new Promise(async resolve => {
    //           vrfCoordinatorV2Mock.RandomWordsRequested().on('data', async event => {
    //               const { requestId } = event.returnValues;

    //               await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, this.PenduelInstance.address);

    //               resolve(true);
    //           });

    //           await this.PenduelInstance.getRandomWords();
    //       });
    //   }

      // request to get random words
      //await getRandomWords();
   // });  
  
  });

}); 
