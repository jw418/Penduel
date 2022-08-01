// import des SC
const MockPenduel = artifacts.require(`MockPenduel`);
// import chai/test-helpers
const { BN, expectRevert, expectEvent, balance, send, ether,} = require(`@openzeppelin/test-helpers`);
const { expect } = require(`chai`);



contract(`MockPenduel`, function (accounts) {

  // constant des adresses pour les tests
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const notPlayer = accounts[8];
  const notadmin = accounts[9];

  // variable qui permet de numéroter nos tests 
  var testCounter = 1;   

  const betSize = ether('0.00005');

  // on déploie le contrat avant chaque test
  beforeEach(async function () {
    this.MockPenduelInstance = await MockPenduel.deployed();   
  });

  // on vérifie toutes les variables/constantes de notre contrat 
  context(`###### variable test ######`, () => {
    it(`${testCounter++}: totalCreatedSessions must be equal to 0`, async function () {
      const totalCreatedSessions = await this.MockPenduelInstance.totalCreatedSessions();
      await expect(totalCreatedSessions).to.be.bignumber.equal(
        `0`,
        `totalCreatedSessions is not 0`
      );
    });

    it(`${testCounter++}: timeOut must be equal to 10000`, async function () {
      const timeOut = await this.MockPenduelInstance.timeOut();
      await expect(timeOut).to.be.bignumber.equal(
        `86400`,
        `timeOut is not 24 hours`
      );
    });

    it(`${testCounter++}: admin must be equal to owner`, async function () {
        const admin = await this.MockPenduelInstance.admin();
        await expect(admin).to.be.bignumber.equal(
          owner,
          `admin is not owner`
        );
      });
    
   });

   // on vérifie toutes les variables/constantes de notre contrat 
  context(`###### create session test ######`, () => {
    
    it(`${testCounter++}: totalCreatedSessions must be equal to 1`, async function () {
      await this.MockPenduelInstance.createSession({from:  player1, value:betSize});
      const totalCreatedSessions = await this.MockPenduelInstance.totalCreatedSessions();
      await expect(totalCreatedSessions).to.be.bignumber.equal(
        `1`,
        `totalCreatedSessions is not 1`
      );
    });

    it(`${testCounter++}: should emit an event session created`, async function () {
        await expectEvent(this.MockPenduelInstance.createSession({from:  player1, value:betSize}), 'SessionCreated', {
        idSession: '1',
        playerOne: {player1},
        betSize: {betSize}
        });
    });

    it(`${testCounter++}: Expect Revert minimun 1 wei`, async function () {      
      await expectRevert(this.MockPenduelInstance.createSession({from:  owner, value:'0'}, 'Error, minimum 1 WEI'))
    });

    it(`${testCounter++}: Expect Revert insufficent vault`, async function () {      
      await expectRevert(this.MockPenduelInstance.createSession({from:  owner, value: ether("9999999999999999")}, 'Error, insufficent vault balance'))
    });
    
   });
   
   

}); 
