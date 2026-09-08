// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MilestoneEscrow
/// @notice Minimal per-milestone escrow for the Milestone-Escrow Guardian demo.
/// @dev Only the guardian (deployer) can release or refund. Native ETH only.
contract MilestoneEscrow {
    struct Escrow {
        address payer;
        address freelancer;
        uint256 amount;
        bool funded;
        bool released;
        bool disputeOpen;
    }

    address public immutable guardian;

    event EscrowFunded(bytes32 indexed milestoneKey, address payer, uint256 amount);
    event FreelancerSet(bytes32 indexed milestoneKey, address freelancer);
    event DisputeSet(bytes32 indexed milestoneKey, bool open);
    event EscrowReleased(bytes32 indexed milestoneKey, address receiver, uint256 amount);
    event EscrowRefunded(bytes32 indexed milestoneKey, address receiver, uint256 amount);

    error NotGuardian();
    error NotFunded(bytes32 milestoneKey);
    error AlreadyReleased(bytes32 milestoneKey);
    error DisputeOpen(bytes32 milestoneKey);
    error NoValue();

    mapping(bytes32 => Escrow) public escrows;

    constructor(address guardian_) {
        guardian = guardian_;
    }

    modifier onlyGuardian() {
        if (msg.sender != guardian) revert NotGuardian();
        _;
    }

    function fund(bytes32 milestoneKey) external payable {
        if (msg.value == 0) revert NoValue();
        Escrow storage escrow = escrows[milestoneKey];
        if (!escrow.funded) {
            escrow.payer = msg.sender;
            escrow.funded = true;
        }
        escrow.amount += msg.value;
        emit EscrowFunded(milestoneKey, msg.sender, msg.value);
    }

    function setFreelancer(bytes32 milestoneKey, address freelancer) external onlyGuardian {
        Escrow storage escrow = escrows[milestoneKey];
        if (!escrow.funded) revert NotFunded(milestoneKey);
        escrow.freelancer = freelancer;
        emit FreelancerSet(milestoneKey, freelancer);
    }

    function setDispute(bytes32 milestoneKey, bool open) external onlyGuardian {
        escrows[milestoneKey].disputeOpen = open;
        emit DisputeSet(milestoneKey, open);
    }

    function release(bytes32 milestoneKey) external onlyGuardian {
        Escrow storage escrow = escrows[milestoneKey];
        if (!escrow.funded) revert NotFunded(milestoneKey);
        if (escrow.released) revert AlreadyReleased(milestoneKey);
        if (escrow.disputeOpen) revert DisputeOpen(milestoneKey);
        address payable receiver = payable(escrow.freelancer);
        if (receiver == address(0)) revert NotFunded(milestoneKey);

        uint256 amount = escrow.amount;
        escrow.amount = 0;
        escrow.released = true;
        (bool ok, ) = receiver.call{value: amount}("");
        require(ok, "release transfer failed");
        emit EscrowReleased(milestoneKey, receiver, amount);
    }

    function refund(bytes32 milestoneKey) external onlyGuardian {
        Escrow storage escrow = escrows[milestoneKey];
        if (!escrow.funded) revert NotFunded(milestoneKey);
        if (escrow.released) revert AlreadyReleased(milestoneKey);

        address payable receiver = payable(escrow.payer);
        uint256 amount = escrow.amount;
        escrow.amount = 0;
        escrow.released = true;
        (bool ok, ) = receiver.call{value: amount}("");
        require(ok, "refund transfer failed");
        emit EscrowRefunded(milestoneKey, receiver, amount);
    }
}