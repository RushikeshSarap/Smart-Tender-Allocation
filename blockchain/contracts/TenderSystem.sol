// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TenderSystem {
    struct BidRecord {
        uint256 tenderId;
        string bidHash;
        uint256 timestamp;
        uint256 finalTrueCost;
        bool isWinner;
    }

    // Maps a unique internal or backend-provided bidId to its record
    mapping(uint256 => BidRecord) public bidRecords;

    event BidHashSubmitted(uint256 indexed bidId, uint256 indexed tenderId, string bidHash, uint256 timestamp);
    event ResultStored(uint256 indexed tenderId, uint256 indexed winnerBidId, uint256 finalTrueCost, uint256 timestamp);

    function submitBidHash(uint256 _bidId, uint256 _tenderId, string memory _bidHash) public {
        require(bidRecords[_bidId].timestamp == 0, "Bid hash already submitted");
        
        bidRecords[_bidId] = BidRecord({
            tenderId: _tenderId,
            bidHash: _bidHash,
            timestamp: block.timestamp,
            finalTrueCost: 0,
            isWinner: false
        });

        emit BidHashSubmitted(_bidId, _tenderId, _bidHash, block.timestamp);
    }

    function storeResult(uint256 _tenderId, uint256 _winnerBidId, uint256 _finalTrueCost) public {
        require(bidRecords[_winnerBidId].tenderId == _tenderId, "Bid ID does not match Tender ID");
        require(bidRecords[_winnerBidId].timestamp != 0, "Bid hash not found");
        require(!bidRecords[_winnerBidId].isWinner, "Result already stored");

        // Immutable update of final true cost and winner flag for the winning bid
        bidRecords[_winnerBidId].finalTrueCost = _finalTrueCost;
        bidRecords[_winnerBidId].isWinner = true;

        emit ResultStored(_tenderId, _winnerBidId, _finalTrueCost, block.timestamp);
    }

    function getBidDetails(uint256 _bidId) public view returns (
        uint256 tenderId,
        string memory bidHash,
        uint256 timestamp,
        uint256 finalTrueCost,
        bool isWinner
    ) {
        BidRecord memory b = bidRecords[_bidId];
        require(b.timestamp != 0, "Bid does not exist");
        return (b.tenderId, b.bidHash, b.timestamp, b.finalTrueCost, b.isWinner);
    }
}
