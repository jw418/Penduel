const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),  // commenté pour utilisé slither
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
      websockets: true,
    },

    develop: {
      port: 8545,
    },

 
    ganache2: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "1337",
    },

    // mainnet: {
    //   provider: function() {
    //     return new HDWalletProvider(`${process.env.MNEMONIC}`, `https://mainnet.infura.io/v3/${process.env.ALCHEMY_ID}`)
    //   },
    //   network_id: 1
    // },

    rinkeby: {
      provider: function () {
        return new HDWalletProvider(
          `${process.env.MNEMONIC}`,
          `https://rinkeby.infura.io/v3/${process.env.ALCHEMY_ID}`
        );
      },
      network_id: 4,
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(
          `${process.env.MNEMONIC}`,
          `https://ropsten.infura.io/v3/${process.env.ALCHEMY_ID}`
        );
      },
      network_id: 3,
    },
    goerli: {
      provider: function () {
        return new HDWalletProvider(
          `${process.env.MNEMONIC}`,
          `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`
        );
      },
      network_id: 5,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.16", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
};