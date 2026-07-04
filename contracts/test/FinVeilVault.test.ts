import hre from "hardhat";
import { expect } from "chai";
import { Encryptable } from "@cofhe/sdk";
import { FinVeilVault } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("FinVeilVault", function () {
  let vault: FinVeilVault;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let requester: HardhatEthersSigner;

  const LENS_RENTAL = hre.ethers.encodeBytes32String("rental-readiness");
  const LENS_BNPL = hre.ethers.encodeBytes32String("bnpl-affordability");

  before(async function () {
    const signers = await hre.ethers.getSigners();
    owner = signers[0];
    user = signers[1];
    requester = signers[2];

    vault = await hre.ethers.deployContract("FinVeilVault", owner);
    await hre.cofhe.createClientWithBatteries(user);
    await hre.cofhe.createClientWithBatteries(requester);
  });

  describe("Profile Management", function () {
    it("should update profile with encrypted fields", async function () {
      const client = await hre.cofhe.createClientWithBatteries(user);
      const encrypted = await client
        .encryptInputs([
          Encryptable.uint32(12n),     // duration (months)
          Encryptable.uint32(0n),      // checkNeg
          Encryptable.uint32(0n),      // checkNone
          Encryptable.uint32(1n),      // checkHigh
          Encryptable.uint32(1n),      // creditPaid
          Encryptable.uint32(0n),      // creditNone
        ])
        .execute();

      const tx = await vault.connect(user).updateProfile(
        encrypted[0],
        encrypted[1],
        encrypted[2],
        encrypted[3],
        encrypted[4],
        encrypted[5]
      );
      await tx.wait();

      const profile = await vault.profiles(user.address);
      const plaintext = await hre.cofhe.mocks.getPlaintext(profile.duration);
      expect(plaintext).to.equal(12n);
    });
  });

  describe("Lens Thresholds", function () {
    it("should set lens thresholds by owner", async function () {
      const tx = await vault
        .connect(owner)
        .setLensThresholds(LENS_RENTAL, 80, 60, 40);
      await tx.wait();

      const t = await vault.lensThresholds(LENS_RENTAL);
      expect(t.exists).to.be.true;
      expect(t.thresholdA).to.equal(80);
    });

    it("should reject setting lens thresholds by non-owner", async function () {
      const tx = vault
        .connect(user)
        .setLensThresholds(LENS_BNPL, 75, 55, 35);
      await expect(tx).to.be.revertedWith("Not authorized");
    });
  });

  describe("Permits", function () {
    it("should grant a one-time permit", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      const tx = await vault
        .connect(user)
        .grantOneTimePermit(requester.address, LENS_RENTAL, expiresAt);
      await tx.wait();

      await expect(tx)
        .to.emit(vault, "PermitGranted")
        .withArgs(user.address, requester.address, LENS_RENTAL, expiresAt);
    });
  });

  describe("Scoring (ML Model)", function () {
    const SCALE = 1000;
    const FEATURE_SCALE = 100;
    const OFFSET = 100000;
    const MODEL_WEIGHTS = [99968n, 99479n, 100414n, 101346n, 100388n, 101010n];
    const MODEL_BIAS = 176938;
    const FEATURE_VALUES = [12n, 0n, 0n, 1n, 1n, 0n]; // Alice: low-risk profile

    function expectedZ(features: bigint[]): bigint {
      let z = BigInt(MODEL_BIAS);
      for (let i = 0; i < features.length; i++) {
        z += MODEL_WEIGHTS[i] * features[i] * BigInt(FEATURE_SCALE);
      }
      return z;
    }

    beforeEach(async function () {
      const client = await hre.cofhe.createClientWithBatteries(user);
      const encrypted = await client
        .encryptInputs([
          Encryptable.uint32(FEATURE_VALUES[0]),
          Encryptable.uint32(FEATURE_VALUES[1]),
          Encryptable.uint32(FEATURE_VALUES[2]),
          Encryptable.uint32(FEATURE_VALUES[3]),
          Encryptable.uint32(FEATURE_VALUES[4]),
          Encryptable.uint32(FEATURE_VALUES[5]),
        ])
        .execute();

      await vault.connect(user).updateProfile(
        encrypted[0], encrypted[1], encrypted[2],
        encrypted[3], encrypted[4], encrypted[5]
      );

      await vault
        .connect(owner)
        .setLensThresholds(LENS_RENTAL, 80, 60, 40);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await vault
        .connect(user)
        .grantOneTimePermit(requester.address, LENS_RENTAL, expiresAt);
    });

    it("should compute a score using the ML model and store it", async function () {
      const tx = await vault
        .connect(requester)
        .requestScore(user.address, LENS_RENTAL);
      await tx.wait();

      const score = await vault.getScore(user.address, LENS_RENTAL);
      const plaintext = await hre.cofhe.mocks.getPlaintext(score);
      const expected = expectedZ(FEATURE_VALUES);
      expect(plaintext).to.equal(expected);
    });

    it("should reject scoring without a valid permit", async function () {
      const tx = vault
        .connect(requester)
        .requestScore(user.address, LENS_BNPL);
      await expect(tx).to.be.revertedWith("Permit not found");
    });

    it("should enforce one-time use of permit", async function () {
      await vault.connect(requester).requestScore(user.address, LENS_RENTAL);

      const tx = vault
        .connect(requester)
        .requestScore(user.address, LENS_RENTAL);
      await expect(tx).to.be.revertedWith("Permit already used");
    });
  });

  describe("KYC", function () {
    it("should submit KYC record", async function () {
      const client = await hre.cofhe.createClientWithBatteries(user);
      const encrypted = await client
        .encryptInputs([
          Encryptable.uint32(12345n),
          Encryptable.uint32(19950703n),
          Encryptable.uint32(12345n),
          Encryptable.uint32(67890n),
        ])
        .execute();

      const tx = await vault.connect(user).submitKYC(
        encrypted[0],
        encrypted[1],
        encrypted[2],
        encrypted[3]
      );
      await tx.wait();

      const kyc = await vault.kycRecords(user.address);
      expect(kyc.initialized).to.be.true;
    });
  });

  describe("KYC Verification", function () {
    beforeEach(async function () {
      const client = await hre.cofhe.createClientWithBatteries(user);
      const encrypted = await client
        .encryptInputs([
          Encryptable.uint32(12345n),
          Encryptable.uint32(19950703n),
          Encryptable.uint32(12345n),
          Encryptable.uint32(67890n),
        ])
        .execute();

      await vault.connect(user).submitKYC(
        encrypted[0],
        encrypted[1],
        encrypted[2],
        encrypted[3]
      );
    });

    it("should verify identity with matching name and ID", async function () {
      const tx = await vault
        .connect(requester)
        .requestVerification(user.address, 0, requester.address, 0);
      const receipt = await tx.wait();

      const event = receipt!.logs.find(
        (l: any) => l.eventName === "VerificationPerformed"
      ) as any;
      expect(event).to.not.be.undefined;
      const sessionId = event!.args.sessionId;

      const vr = await vault.getVerificationResult(user.address, sessionId);
      const plaintext = await hre.cofhe.mocks.getPlaintext(vr);
      expect(plaintext).to.equal(1n);
    });

    it("should verify age above 18", async function () {
      const tx = await vault
        .connect(requester)
        .requestVerification(user.address, 1, requester.address, 20080703);
      const receipt = await tx.wait();

      const event = receipt!.logs.find(
        (l: any) => l.eventName === "VerificationPerformed"
      ) as any;
      const sessionId = event!.args.sessionId;

      const vr = await vault.getVerificationResult(user.address, sessionId);
      const plaintext = await hre.cofhe.mocks.getPlaintext(vr);
      expect(plaintext).to.equal(1n);
    });

    it("should fail age check if cutoff is too early", async function () {
      const tx = await vault
        .connect(requester)
        .requestVerification(user.address, 1, requester.address, 19900101);
      const receipt = await tx.wait();

      const event = receipt!.logs.find(
        (l: any) => l.eventName === "VerificationPerformed"
      ) as any;
      const sessionId = event!.args.sessionId;

      const vr = await vault.getVerificationResult(user.address, sessionId);
      const plaintext = await hre.cofhe.mocks.getPlaintext(vr);
      expect(plaintext).to.equal(0n);
    });

    it("should issue verification token event", async function () {
      const tx = await vault
        .connect(requester)
        .requestVerification(user.address, 0, requester.address, 0);
      const receipt = await tx.wait();

      const event = receipt!.logs.find(
        (l: any) => l.eventName === "VerificationPerformed"
      ) as any;
      const sessionId = event!.args.sessionId;

      const tokenTx = await vault
        .connect(requester)
        .issueVerificationToken(user.address, sessionId);
      await tokenTx.wait();

      await expect(tokenTx)
        .to.emit(vault, "VerificationTokenIssued")
        .withArgs(user.address, requester.address, sessionId, false);
    });
  });
});
