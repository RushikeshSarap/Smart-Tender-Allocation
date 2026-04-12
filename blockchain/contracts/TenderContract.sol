// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TenderContract {
    address public owner;

    struct Bid {
        string bidHash;
        uint256 timestamp;
    }

    struct Result {
        uint256 tenderId;
        string winnerId;
        uint256 trueCost;
        string resultHash;
        uint256 timestamp;
    }

    mapping(uint256 => Bid[]) public tenderBids;
    mapping(uint256 => Result) public tenderResults;

    event BidHashSubmitted(uint256 indexed tenderId, string bidHash, uint256 timestamp);
    event ResultStored(uint256 indexed tenderId, string winnerId, uint256 trueCost, string resultHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function submitBidHash(uint256 tenderId, string memory bidHash) public onlyOwner {
        tenderBids[tenderId].push(Bid({ bidHash: bidHash, timestamp: block.timestamp }));
        emit BidHashSubmitted(tenderId, bidHash, block.timestamp);
    }

    function storeResult(
        uint256 tenderId,
        string memory winnerId,
        uint256 trueCost,
        string memory resultHash
    ) public onlyOwner {
        tenderResults[tenderId] = Result({
            tenderId: tenderId,
            winnerId: winnerId,
            trueCost: trueCost,
            resultHash: resultHash,
            timestamp: block.timestamp
        });
        emit ResultStored(tenderId, winnerId, trueCost, resultHash, block.timestamp);
    }

    function getBids(uint256 tenderId) public view returns (Bid[] memory) {
        return tenderBids[tenderId];
    }

    function getResult(uint256 tenderId) public view returns (Result memory) {
        return tenderResults[tenderId];
    }
}
