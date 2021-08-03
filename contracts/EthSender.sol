// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

contract EthSender {
    function sendEthAtTime(uint256 time, address payable recipient)
        external
        payable
    {
        require(block.timestamp >= time, "Too soon");
        recipient.transfer(msg.value);
    }

    function newReq(
        address target,
        address payable referer,
        bytes calldata callData,
        uint120 ethForCall,
        bool verifySender,
        bool payWithAUTO
    ) external payable returns (uint256 id);
}
