require("dotenv").config(); //initialize dotenv

const { Client, MessageAttachment } = require("discord.js");
const client = new Client();
const axios = require("axios");
const abi = require("./abi");
var Web3 = require("web3");
var provider = process.env.MAINNET;
var web3Provider = new Web3.providers.HttpProvider(provider);
var web3 = new Web3(web3Provider);
const ens = web3.eth.ens;
const myContract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
let options = {
  fromBlock: 0, //Number || "earliest" || "pending" || "latest"
  toBlock: "latest",
};

web3.eth.getBlockNumber().then((result) => {
  console.log("Latest Ethereum Block is ", result);
});
/**
 * Get all AfroList mints
 * @returns Array
 */
const ShowMints = async () =>
  await myContract.getPastEvents("OGMinted", options);
const balanceOf = async (a) => await myContract.methods.balanceOf(a).call();
const ownerOf = async (id) => await myContract.methods.ownerOf(id).call();
/**
 * Get total supply of tokens
 * @returns int
 */
const totalSupply = async () => await myContract.methods.totalSupply().call();

/**
 * Get a token
 * @param {Object} msg
 * @returns void
 */
const getToken = async (msg) => {
  const id = parseInt(msg.content.split("-")[1]);
  const supply = await totalSupply();
  if (id > supply) {
    msg.reply("token does not exist");
    return;
  }
  msg.reply(`Fetching token ${id}...`);
  await axios
    .get("https://api.afroapes.com/v1/collections/afro-apes-the-origin/" + id)
    .then((response) => {
      const url = response.data;
      msg.channel.send(url.temp_path);
      // msg.channel.send(new MessageAttachment(url.temp_path))
    });
};

/**
 * Get owners Balance of token
 * @param {object} msg
 */
const processBalance = async (msg) => {
  const addr = msg.content.split(" ")[1];
  const regexp =
    /^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/g;
  if (regexp.test(addr)) {
    const address = await ens.getAddress(addr);
    msg.channel.send(`checking balance...`);
    msg.channel.startTyping(3);

    try {
      msg.channel.send(
        `Elder ${addr} owns ${await balanceOf(
          address
        )} Afro Apes Origin. You're an Elder `
      );
    } catch (error) {
      msg.reply("Unexpected error occured while fetching balance");
    }
  } else if (Web3.utils.isAddress(addr)) {
    msg.channel.send(`checking balance...`);
    msg.channel.send(
      `${addr} owns ${await balanceOf(address)} Afro Apes Origin. `
    );
  } else {
    msg.reply(`${address} is not valid`);
  }
  msg.channel.stopTyping(true);
};

/**
 * Get owner of token
 * @param {object} msg
 */
const getOwnerOfToken = async (msg) => {
  const id = parseInt(msg.content.trim().split(" ")[1]);
  const supply = await totalSupply();
  if (id > supply) {
    msg.reply("token does not exist");
    return;
  }
  try {
    msg.channel.send(`Fetching owner of token ${id}...`);

    msg.channel.startTyping(3);
    const owner = await ownerOf(id)
    await axios
    .get("https://api.afroapes.com/v1/collections/afro-apes-the-origin/" + id)
    .then((response) => {
      const url = response.data;
      msg.channel.send(new MessageAttachment(url.temp_path))
      msg.channel.send(
        `Elder ${owner} owns this Afro Ape `
      );
    });
    
  } catch (error) {
    msg.reply("Unexpected error occured while fetching balance");
  }

  msg.channel.stopTyping(true);
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  try {
    if (msg.content.startsWith("!token-")) {
      await getToken(msg);
      // msg.reply(mints[id]);
    }
    else if (msg.content === "!mints") {
      const mints = await ShowMints();
      msg.channel.send(`AL mint ${mints.length}/50`);
    }
    else if (msg.content.startsWith("!balance")) {
      await processBalance(msg);
    }
    else if (msg.content.startsWith("!owner-of")) {
      await getOwnerOfToken(msg);
    }
    else{
      msg.reply(`Hello how are you? `);
    }
  } catch (error) {
    msg.reply("Unexpected error occured: " + error.message);
  }
});

client.login(process.env.CLIENT_TOKEN); //login bot using token
