/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../common";
import type {
  MockBenchmarkFacet20,
  MockBenchmarkFacet20Interface,
} from "../../facets/MockBenchmarkFacet20";

const _abi = [
  {
    inputs: [],
    name: "benchmark20",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "complexOperation20",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b506101b0806100206000396000f3fe608060405234801561001057600080fd5b50600436106100355760003560e01c8062cc21d41461003a578063b4ea01b61461007a575b600080fd5b6040805180820182526015815274042656e63686d61726b2066756e6374696f6e20323605c1b6020820152905161007191906100cd565b60405180910390f35b610082610090565b604051908152602001610071565b600080805b60648110156100c7576100a9816015610131565b6100b3908361014e565b9150806100bf81610161565b915050610095565b50919050565b600060208083528351808285015260005b818110156100fa578581018301518582016040015282016100de565b506000604082860101526040601f19601f8301168501019250505092915050565b634e487b7160e01b600052601160045260246000fd5b80820281158282048414176101485761014861011b565b92915050565b808201808211156101485761014861011b565b6000600182016101735761017361011b565b506001019056fea2646970667358221220d21df4bab16a59978cec9ed785cf470a05ca9aa940d097dfc9dc694c9a345de664736f6c63430008110033";

type MockBenchmarkFacet20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockBenchmarkFacet20ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockBenchmarkFacet20__factory extends ContractFactory {
  constructor(...args: MockBenchmarkFacet20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      MockBenchmarkFacet20 & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): MockBenchmarkFacet20__factory {
    return super.connect(runner) as MockBenchmarkFacet20__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockBenchmarkFacet20Interface {
    return new Interface(_abi) as MockBenchmarkFacet20Interface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): MockBenchmarkFacet20 {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as MockBenchmarkFacet20;
  }
}
