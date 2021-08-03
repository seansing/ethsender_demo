import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import { Form, Input, Button, Alert } from "antd";
import "antd/dist/antd.css";

import "./App.css";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    receipientAddress: "0x0",
    ethSenderContract: null,
    registryContract: null,
    instance: null,
    ethInput: 0,
    ethToSend: 0,
    ethForCall: "",
    timeToSend: 0,
    buttonText: "Submit",
  };

  //Deployed contract addresses
  ethSenderContractAddress = "0xfa0a8b60B2AF537DeC9832f72FD233e93E4C8463";
  registryContractAddress = "0xB82Ae7779aB1742734fCE32A4b7fDBCf020F2667";

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      //EthSender's ABI
      const EthSenderABI = [
        {
          inputs: [
            { internalType: "uint256", name: "time", type: "uint256" },
            {
              internalType: "address payable",
              name: "recipient",
              type: "address",
            },
          ],
          name: "sendEthAtTime",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ];

      //Instance of EthSender contract
      const instance = new web3.eth.Contract(
        EthSenderABI,
        this.ethSenderContractAddress
      );

      //Registry's ABI, obtained from compiling a sample contract with Registry's interface function
      const RegistryABI = [
        {
          inputs: [
            {
              internalType: "address",
              name: "target",
              type: "address",
            },
            {
              internalType: "address payable",
              name: "referer",
              type: "address",
            },
            {
              internalType: "bytes",
              name: "callData",
              type: "bytes",
            },
            {
              internalType: "uint120",
              name: "ethForCall",
              type: "uint120",
            },
            {
              internalType: "bool",
              name: "verifySender",
              type: "bool",
            },
            {
              internalType: "bool",
              name: "payWithAUTO",
              type: "bool",
            },
          ],
          name: "newReq",
          outputs: [
            {
              internalType: "uint256",
              name: "id",
              type: "uint256",
            },
          ],
          payable: true,
          stateMutability: "payable",
          type: "function",
        },
      ];

      //Instance of Registry contract
      const registryInstance = new web3.eth.Contract(
        RegistryABI,
        this.registryContractAddress
      );

      // Set web3, accounts, and contract instances to the state
      this.setState({
        web3,
        accounts,
        ethSenderContract: instance,
        registryContract: registryInstance,
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  //Update the state of timeToSend as user's time input
  getUserTime = (e) => {
    this.setState({ timeToSend: e.target.value });
  };

  //Update the state of receipientAddress as user's receipient address
  getReceipientAddress = (e) => {
    this.setState({ receipientAddress: e.target.value });
  };

  //Update the state of ethToSend and ethForCall based on user's input of ETH to send
  getUserEthToSend = (e) => {
    if (e.target.value !== "") {
      //convert to float for addition 0f 0.01
      const float = parseFloat(e.target.value);

      //convert from ether input to wei
      const ethToSend = this.state.web3.utils.toWei(e.target.value, "ether");

      //convert to ether after adding 0.01 ether
      const calculate = this.state.web3.utils.toWei(
        (float + 0.01).toString(),
        "ether"
      );

      this.setState({
        ethInput: e.target.value,
        ethToSend: ethToSend,
        ethForCall: calculate,
      });
    } else {
      console.log("Blank input.");
    }
  };

  //Sending the transaction to newReq of Registry. Includes setting up callData for the EthSender Contract
  sendTransaction = async (e) => {
    e.preventDefault();
    this.setState({ buttonText: "Transacting..." });
    const { accounts, registryContract } = this.state;

    //setup callData, passing in timeToSend Ether and Receipient's address
    const callData = this.state.ethSenderContract.methods
      .sendEthAtTime(this.state.timeToSend, this.state.receipientAddress)
      .encodeABI();

    //send a transaction to newReq
    await registryContract.methods
      .newReq(
        this.ethSenderContractAddress,
        "0x0000000000000000000000000000000000000000",
        callData,
        this.state.ethToSend,
        false,
        false
      )
      .send({
        from: accounts[0],
        value: this.state.ethForCall,
      })
      .then(this.setState({ button: "Submit" }));
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div>
        <Alert
          message="EthSender Demo currently runs on the Ropsten Testnet only."
          type="warning"
          style={{ textAlign: "center" }}
        />

        <div
          className="App"
          style={{
            alignitems: "center",
            justifyContent: "center",
            width: "40%",
            margin: "auto",
            marginTop: "30px",
            color: "white",
          }}
        >
          <h1>EthSender Demo ⧫ ✉️ </h1>
          <h2>
            Send ETH to anyone at a later time via{" "}
            <a
              href="https://www.autonomynetwork.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Autonomy Network
            </a>
            !
          </h2>
          <br />
          <Form layout="vertical">
            <Form.Item
              label="Step 1 : Enter receipient's address."
              required
              tooltip="Input your receipient's Ethereum Address."
            >
              <Input
                placeholder="eg. 0x35Fbaed66BBbd15a67332750994F3444e27285A3"
                onChange={this.getReceipientAddress}
              />
            </Form.Item>
            <Form.Item
              label="Step 2 : Enter amount of ETH to send."
              required
              tooltip="Input the amount of ETH to send."
            >
              <Input placeholder="eg. 1" onChange={this.getUserEthToSend} />
            </Form.Item>
            <Form.Item
              label="Step 3 : Enter a time to Send ETH (Unix Timestamp) : "
              required
              tooltip="Input a future Unix timestamp (seconds) to send the ETH amount."
            >
              <Input placeholder="eg. 1637964864" onChange={this.getUserTime} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={this.sendTransaction}
                style={{
                  borderRadius: "10px",
                }}
              >
                {this.state.buttonText}
              </Button>
            </Form.Item>
          </Form>

          <h3>
            You are sending <strong>{this.state.ethInput} ETH</strong> to{" "}
            <strong>{this.state.receipientAddress}</strong> at Unix timestamp{" "}
            <strong>{this.state.timeToSend}</strong>.
          </h3>
        </div>
      </div>
    );
  }
}

export default App;
