"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.updateOwnerForTest = exports.impersonateAndFundSigner = exports.setEtherBalance = exports.impersonateSigner = void 0;
var hardhat_1 = require("hardhat");
var common_1 = require("./common");
/**
 * Impersonates a signer account. This is primarily used in Hardhat's testing environment
 * to simulate actions from accounts that are not part of the default test accounts.
 *
 * @param signerAddress - The address of the account to impersonate.
 * @returns The impersonated signer object.
 */
function impersonateSigner(signerAddress, provider) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hardhat_1.ethers.provider = provider; // Set the provider to the one passed in
                    // Request Hardhat to impersonate the account at the specified address
                    return [4 /*yield*/, hardhat_1.ethers.provider.send("hardhat_impersonateAccount", [signerAddress])];
                case 1:
                    // Request Hardhat to impersonate the account at the specified address
                    _a.sent();
                    return [2 /*return*/, provider.getSigner(signerAddress)]; // Return the impersonated signer
            }
        });
    });
}
exports.impersonateSigner = impersonateSigner;
/**
 * Sets the Ether balance for a specified address in the Hardhat testing environment.
 * This is useful for ensuring test accounts have sufficient funds for transactions.
 *
 * @param address - The address to set the Ether balance for.
 * @param amount - The desired balance as a `BigNumber`.
 */
function setEtherBalance(address, amount, provider) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hardhat_1.ethers.provider = provider;
                    return [4 /*yield*/, hardhat_1.ethers.provider.send('hardhat_setBalance', [
                            address,
                            amount.toHexString().replace('0x0', '0x'), // Amount to set, formatted as a hex string
                        ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setEtherBalance = setEtherBalance;
/**
 * Impersonates the deployer account and funds it to a balance that is rounded to the next highest 100 ETH.
 *
 * @param provider - The ethers provider instance.
 * @param deployerAddress - The address of the deployer account.
 * @param balance - The balance to set for the deployer account (in hex format).
 */
function impersonateAndFundSigner(deployerAddress, provider) {
    return __awaiter(this, void 0, void 0, function () {
        var signer, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, provider.send('hardhat_impersonateAccount', [deployerAddress])];
                case 1:
                    _a.sent();
                    signer = provider.getSigner(deployerAddress);
                    // Fund the account
                    return [4 /*yield*/, provider.send('hardhat_setBalance', [deployerAddress, '0x56BC75E2D63100000'])];
                case 2:
                    // Fund the account
                    _a.sent();
                    return [2 /*return*/, signer];
                case 3:
                    error_1 = _a.sent();
                    if (error_1 instanceof Error) {
                        console.error("Impersonation and funding failed for ".concat(deployerAddress, ": ").concat(error_1.message));
                    }
                    else {
                        console.error("Impersonation and funding failed for ".concat(deployerAddress, ": ").concat(String(error_1)));
                    }
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.impersonateAndFundSigner = impersonateAndFundSigner;
/**
 * Updates the owner of the contract at the specified root address for testing purposes.
 * This involves transferring ownership from the current owner to the default signer in the Hardhat environment.
 *
 * @param rootAddress - The address of the root contract (e.g., GeniusOwnershipFacet).
 * @returns The address of the old owner.
 */
var updateOwnerForTest = function (rootAddress, provider) { return __awaiter(void 0, void 0, void 0, function () {
    var curOwner, ownership, oldOwnerAddress, oldOwner, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, hardhat_1.ethers.getSigners()];
            case 1:
                curOwner = (_c.sent())[0];
                return [4 /*yield*/, hardhat_1.ethers.getContractAt('GeniusOwnershipFacet', rootAddress)];
            case 2:
                ownership = _c.sent();
                return [4 /*yield*/, ownership.owner()];
            case 3:
                oldOwnerAddress = _c.sent();
                return [4 /*yield*/, impersonateSigner(oldOwnerAddress, provider)];
            case 4:
                oldOwner = _c.sent();
                if (!(oldOwnerAddress !== curOwner.address)) return [3 /*break*/, 9];
                debuglog("Transferring ownership from ".concat(oldOwnerAddress));
                // Ensure the old owner has enough Ether to perform the ownership transfer
                return [4 /*yield*/, setEtherBalance(oldOwnerAddress, (0, common_1.toWei)(10), provider)];
            case 5:
                // Ensure the old owner has enough Ether to perform the ownership transfer
                _c.sent();
                _b = (_a = ownership).connect;
                return [4 /*yield*/, oldOwner];
            case 6: return [4 /*yield*/, _b.apply(_a, [_c.sent()]).transferOwnership(curOwner.address)];
            case 7:
                _c.sent();
                return [4 /*yield*/, ownership.connect(oldOwner).transferOwnership(curOwner.address)];
            case 8:
                _c.sent();
                _c.label = 9;
            case 9: 
            // Return the address of the old owner
            return [2 /*return*/, oldOwnerAddress];
        }
    });
}); };
exports.updateOwnerForTest = updateOwnerForTest;
