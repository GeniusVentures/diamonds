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
  MockBenchmarkFacet17,
  MockBenchmarkFacet17Interface,
} from "../../facets/MockBenchmarkFacet17";

const _abi = [
  {
    inputs: [],
    name: "benchmark17",
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
    name: "complexOperation17",
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
  "0x608060405234801561001057600080fd5b506101ad806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063a3e33e9f1461003b578063ee0a0d0814610056575b600080fd5b61004361008d565b6040519081526020015b60405180910390f35b604080518082018252601581527442656e63686d61726b2066756e6374696f6e20313760581b6020820152905161004d91906100ca565b600080805b60648110156100c4576100a681601261012e565b6100b0908361014b565b9150806100bc8161015e565b915050610092565b50919050565b600060208083528351808285015260005b818110156100f7578581018301518582016040015282016100db565b506000604082860101526040601f19601f8301168501019250505092915050565b634e487b7160e01b600052601160045260246000fd5b808202811582820484141761014557610145610118565b92915050565b8082018082111561014557610145610118565b60006001820161017057610170610118565b506001019056fea2646970667358221220e132aaef477911688a920e7434515e45ae059e18a5171eb4b05afe05126f000764736f6c63430008110033";

type MockBenchmarkFacet17ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockBenchmarkFacet17ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockBenchmarkFacet17__factory extends ContractFactory {
  constructor(...args: MockBenchmarkFacet17ConstructorParams) {
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
      MockBenchmarkFacet17 & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): MockBenchmarkFacet17__factory {
    return super.connect(runner) as MockBenchmarkFacet17__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockBenchmarkFacet17Interface {
    return new Interface(_abi) as MockBenchmarkFacet17Interface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): MockBenchmarkFacet17 {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as MockBenchmarkFacet17;
  }
}
