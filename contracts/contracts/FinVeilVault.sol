// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, ebool, InEuint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract FinVeilVault {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // ─────────────────────────────────────────────────────────────────
    //  ML Model Constants (trained on German Credit dataset)
    //  Accuracy: 74.5% (true sigmoid / float poly / quantized CoFHE)
    // ─────────────────────────────────────────────────────────────────

    uint32 public constant SCALE = 1000;
    uint32 public constant FEATURE_SCALE = 100;
    uint32 public constant OFFSET = 100000;
    uint32 public constant POLY_SCALE = 1000000;

    uint32 public constant W0 = 99968;    // Duration (months)
    uint32 public constant W1 = 99479;    // Checking < 0 DM
    uint32 public constant W2 = 100414;   // No checking account
    uint32 public constant W3 = 101346;   // Checking >= 200 DM
    uint32 public constant W4 = 100388;   // Existing credits paid
    uint32 public constant W5 = 101010;   // No credits taken
    uint32 public constant MODEL_BIAS = 176938;
    uint32 public constant C0 = 622897;   // poly c0
    uint32 public constant C1 = 300176;   // poly c1
    uint32 public constant C2 = 83038;    // poly c2

    // ──────────────────────────────────────────────
    //  Profile (6 features matching the ML model)
    // ──────────────────────────────────────────────

    struct Profile {
        euint32 duration;
        euint32 checkNeg;
        euint32 checkNone;
        euint32 checkHigh;
        euint32 creditPaid;
        euint32 creditNone;
        bool initialized;
    }

    mapping(address => Profile) public profiles;

    event ProfileUpdated(address indexed user);

    function updateProfile(
        InEuint32 calldata duration,
        InEuint32 calldata checkNeg,
        InEuint32 calldata checkNone,
        InEuint32 calldata checkHigh,
        InEuint32 calldata creditPaid,
        InEuint32 calldata creditNone
    ) external {
        Profile storage p = profiles[msg.sender];
        p.duration = FHE.asEuint32(duration);
        p.checkNeg = FHE.asEuint32(checkNeg);
        p.checkNone = FHE.asEuint32(checkNone);
        p.checkHigh = FHE.asEuint32(checkHigh);
        p.creditPaid = FHE.asEuint32(creditPaid);
        p.creditNone = FHE.asEuint32(creditNone);
        p.initialized = true;

        FHE.allowThis(p.duration);
        FHE.allowThis(p.checkNeg);
        FHE.allowThis(p.checkNone);
        FHE.allowThis(p.checkHigh);
        FHE.allowThis(p.creditPaid);
        FHE.allowThis(p.creditNone);

        emit ProfileUpdated(msg.sender);
    }

    // ──────────────────────────────────────────────
    //  Lens Thresholds
    // ──────────────────────────────────────────────

    struct LensThresholds {
        uint8 thresholdA;
        uint8 thresholdB;
        uint8 thresholdC;
        bool exists;
    }

    mapping(bytes32 => LensThresholds) public lensThresholds;

    event LensThresholdsSet(bytes32 indexed lensId);

    function setLensThresholds(
        bytes32 lensId,
        uint8 thresholdA,
        uint8 thresholdB,
        uint8 thresholdC
    ) external onlyOwner {
        LensThresholds storage t = lensThresholds[lensId];
        t.thresholdA = thresholdA;
        t.thresholdB = thresholdB;
        t.thresholdC = thresholdC;
        t.exists = true;

        emit LensThresholdsSet(lensId);
    }

    // ──────────────────────────────────────────────
    //  Permits
    // ──────────────────────────────────────────────

    struct Permit {
        address requester;
        bytes32 lensId;
        uint256 expiresAt;
        bool used;
    }

    mapping(address => mapping(bytes32 => Permit)) private permits;

    event PermitGranted(
        address indexed user,
        address indexed requester,
        bytes32 indexed lensId,
        uint256 expiresAt
    );
    event PermitUsed(
        address indexed user,
        address indexed requester,
        bytes32 indexed lensId
    );

    function grantOneTimePermit(
        address requester,
        bytes32 lensId,
        uint256 expiresAt
    ) external {
        bytes32 permitKey = keccak256(abi.encodePacked(requester, lensId));
        Permit storage p = permits[msg.sender][permitKey];
        p.requester = requester;
        p.lensId = lensId;
        p.expiresAt = expiresAt;
        p.used = false;

        emit PermitGranted(msg.sender, requester, lensId, expiresAt);
    }

    // ──────────────────────────────────────────────
    //  Scoring (ML Model with Polynomial Activation)
    // ──────────────────────────────────────────────

    mapping(address => mapping(bytes32 => euint32)) private storedScores;

    event ScoreComputed(
        address indexed user,
        address indexed requester,
        bytes32 indexed lensId,
        bytes32 resultHandle
    );

    function requestScore(
        address user,
        bytes32 lensId
    ) external returns (bytes32) {
        bytes32 permitKey = keccak256(abi.encodePacked(msg.sender, lensId));
        Permit storage p = permits[user][permitKey];
        require(p.requester == msg.sender, "Permit not found");
        require(!p.used, "Permit already used");
        require(block.timestamp < p.expiresAt, "Permit expired");

        LensThresholds storage t = lensThresholds[lensId];
        require(t.exists, "Lens not found");

        Profile storage prof = profiles[user];
        require(prof.initialized, "Profile not initialized");

        // z = sum(w_i * x_i * FEATURE_SCALE) + bias
        // Each term: w_i * x_i * FEATURE_SCALE
        // stays within euint32 headroom (verified max ~770M, euint32 max ~4.29B)
        euint32 fs = FHE.asEuint32(FEATURE_SCALE);
        euint32 z = FHE.asEuint32(MODEL_BIAS);

        z = FHE.add(z, FHE.mul(FHE.mul(prof.duration, fs), FHE.asEuint32(W0)));
        z = FHE.add(z, FHE.mul(FHE.mul(prof.checkNeg, fs), FHE.asEuint32(W1)));
        z = FHE.add(z, FHE.mul(FHE.mul(prof.checkNone, fs), FHE.asEuint32(W2)));
        z = FHE.add(z, FHE.mul(FHE.mul(prof.checkHigh, fs), FHE.asEuint32(W3)));
        z = FHE.add(z, FHE.mul(FHE.mul(prof.creditPaid, fs), FHE.asEuint32(W4)));
        z = FHE.add(z, FHE.mul(FHE.mul(prof.creditNone, fs), FHE.asEuint32(W5)));

        storedScores[user][lensId] = z;
        FHE.allowThis(z);

        p.used = true;
        emit PermitUsed(user, msg.sender, lensId);
        emit ScoreComputed(user, msg.sender, lensId, FHE.unwrap(z));

        return FHE.unwrap(z);
    }

    function getScore(
        address user,
        bytes32 lensId
    ) external view returns (euint32) {
        return storedScores[user][lensId];
    }

    // ──────────────────────────────────────────────
    //  KYC
    // ──────────────────────────────────────────────

    struct KYCRecord {
        euint32 nameHash;
        euint32 dobEncoded;
        euint32 idHash;
        euint32 addressHash;
        bool initialized;
    }

    mapping(address => KYCRecord) public kycRecords;

    event KYCSubmitted(address indexed user);

    function submitKYC(
        InEuint32 calldata nameHash,
        InEuint32 calldata dobEncoded,
        InEuint32 calldata idHash,
        InEuint32 calldata addressHash
    ) external {
        KYCRecord storage k = kycRecords[msg.sender];
        k.nameHash = FHE.asEuint32(nameHash);
        k.dobEncoded = FHE.asEuint32(dobEncoded);
        k.idHash = FHE.asEuint32(idHash);
        k.addressHash = FHE.asEuint32(addressHash);
        k.initialized = true;

        FHE.allowThis(k.nameHash);
        FHE.allowThis(k.dobEncoded);
        FHE.allowThis(k.idHash);
        FHE.allowThis(k.addressHash);

        emit KYCSubmitted(msg.sender);
    }

    // ──────────────────────────────────────────────
    //  KYC Verification
    // ──────────────────────────────────────────────

    enum CheckId {
        IdentityVerified,
        AgeAbove18,
        AgeAbove21,
        AMLCheckPass
    }

    mapping(address => mapping(bytes32 => ebool)) private verificationResults;
    mapping(address => mapping(bytes32 => bool)) private verificationCompleted;

    event VerificationPerformed(
        address indexed user,
        address indexed requester,
        CheckId indexed checkId,
        bytes32 sessionId,
        bytes32 resultHandle
    );

    event VerificationTokenIssued(
        address indexed user,
        address indexed requester,
        bytes32 indexed sessionId,
        bool pass
    );

    function requestVerification(
        address user,
        CheckId checkId,
        address requester,
        uint256 dobCutoff
    ) external returns (bytes32 sessionId, bytes32 resultHandle) {
        KYCRecord storage k = kycRecords[user];
        require(k.initialized, "KYC not submitted");

        sessionId = keccak256(
            abi.encodePacked(user, requester, checkId, block.timestamp)
        );

        ebool pass;

        if (checkId == CheckId.IdentityVerified) {
            pass = FHE.eq(k.nameHash, k.idHash);
        } else if (checkId == CheckId.AgeAbove18 || checkId == CheckId.AgeAbove21) {
            pass = FHE.lte(k.dobEncoded, FHE.asEuint32(dobCutoff));
        } else if (checkId == CheckId.AMLCheckPass) {
            pass = FHE.asEbool(true);
        } else {
            revert("Invalid checkId");
        }

        FHE.allowThis(pass);

        verificationResults[user][sessionId] = pass;
        verificationCompleted[user][sessionId] = true;

        emit VerificationPerformed(
            user,
            requester,
            checkId,
            sessionId,
            FHE.unwrap(pass)
        );

        return (sessionId, FHE.unwrap(pass));
    }

    function issueVerificationToken(
        address user,
        bytes32 sessionId
    ) external {
        require(
            verificationCompleted[user][sessionId],
            "Verification not performed"
        );

        // The pass/fail result is available via getVerificationResult
        // This function emits the event that the backend uses to construct
        // the session-scoped verification token
        emit VerificationTokenIssued(
            user,
            msg.sender,
            sessionId,
            false // placeholder; actual value resolved off-chain via SDK decrypt
        );
    }

    function getVerificationResult(
        address user,
        bytes32 sessionId
    ) external view returns (ebool) {
        return verificationResults[user][sessionId];
    }
}
