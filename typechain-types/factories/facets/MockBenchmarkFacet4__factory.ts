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
  MockBenchmarkFacet4,
  MockBenchmarkFacet4Interface,
} from "../../facets/MockBenchmarkFacet4";

const _abi = [
  {
    inputs: [],
    name: "benchmark4",
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
    name: "complexOperation4",
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
  "0x608060405234801561001057600080fd5b506101ac806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806382ac07361461003b578063da5c6b7b14610056575b600080fd5b61004361008c565b6040519081526020015b60405180910390f35b604080518082018252601481527310995b98da1b585c9ac8199d5b98dd1a5bdb880d60621b6020820152905161004d91906100c9565b600080805b60648110156100c3576100a581600561012d565b6100af908361014a565b9150806100bb8161015d565b915050610091565b50919050565b600060208083528351808285015260005b818110156100f6578581018301518582016040015282016100da565b506000604082860101526040601f19601f8301168501019250505092915050565b634e487b7160e01b600052601160045260246000fd5b808202811582820484141761014457610144610117565b92915050565b8082018082111561014457610144610117565b60006001820161016f5761016f610117565b506001019056fea2646970667358221220d462a3d1dd1845face901bf1a83e78791936baa76a0ae9fefecefd5ad188bcce64736f6c63430008110033";

type MockBenchmarkFacet4ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockBenchmarkFacet4ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockBenchmarkFacet4__factory extends ContractFactory {
  constructor(...args: MockBenchmarkFacet4ConstructorParams) {
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
      MockBenchmarkFacet4 & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): MockBenchmarkFacet4__factory {
    return super.connect(runner) as MockBenchmarkFacet4__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockBenchmarkFacet4Interface {
    return new Interface(_abi) as MockBenchmarkFacet4Interface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): MockBenchmarkFacet4 {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as MockBenchmarkFacet4;
  }
}
