require("dotenv").config(); //initialize dotenv

const {Client, MessageAttachment} = require("discord.js");
const client = new Client();
const axios = require("axios");
const abi = require("./abi");
var Web3 = require('web3');
var provider = process.env.MAINNET;
var web3Provider = new Web3.providers.HttpProvider(provider);
var web3 = new Web3(web3Provider);
const myContract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
let options = {

  fromBlock: 0,                  //Number || "earliest" || "pending" || "latest"
  toBlock: 'latest'
};
/**
 * Get all AfroList mints
 * @returns Array
 */
const ShowMints = async ()=> await myContract.getPastEvents('OGMinted', options)
const balanceOf = async (address)=> await myContract.methods.balanceOf(address).call()
/**
 * Get a token
 * @param {Object} msg 
 * @returns void
 */
 const getToken = async (msg) => {
  const id = parseInt(msg.content.split('-')[1])
  const mints = await ShowMints()
  if(id > (mints.length + 7) - 1) {
    msg.reply('token does not exist')
    return;
  }
  msg.reply(`Fetching token ${id}...`)
  await axios.get('https://api.afroapes.com/v1/collections/afro-apes-the-origin/'+id).then(response => {
  
    const url = response.data
    msg.reply(url.temp_path);
    // msg.channel.send(new MessageAttachment(url.temp_path))
  })
}
const processBalance = async (msg)=>{
  const address = msg.content.split(' ')[1]
  if (Web3.utils.isAddress(address)) {
    msg.reply(await balanceOf(address))
  }
  else{
    msg.reply(`${address} is not valid`)
  }
}
    // .catch(err => throw err);
web3.eth.getBlockNumber().then((result) => {
  console.log("Latest Ethereum Block is ",result);
});
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});


client.on("message", async (msg) => {
  if (msg.content.startsWith("!token-")) {
    await getToken(msg)
    // msg.reply(mints[id]);
  }
  if (msg.content === "!mints") {
    const mints = await ShowMints()
    msg.reply(`AL mint ${mints.length}/50`);
  }
  if (msg.content.startsWith('!balance') ) {
    await processBalance(msg)
  }
});



client.login(process.env.CLIENT_TOKEN); //login bot using token
