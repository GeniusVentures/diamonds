/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface MockBenchmarkFacet20Interface extends Interface {
  getFunction(
    nameOrSignature: "benchmark20" | "complexOperation20"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "benchmark20",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "complexOperation20",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "benchmark20",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "complexOperation20",
    data: BytesLike
  ): Result;
}

export interface MockBenchmarkFacet20 extends BaseContract {
  connect(runner?: ContractRunner | null): MockBenchmarkFacet20;
  waitForDeployment(): Promise<this>;

  interface: MockBenchmarkFacet20Interface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  benchmark20: TypedContractMethod<[], [string], "view">;

  complexOperation20: TypedContractMethod<[], [bigint], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "benchmark20"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "complexOperation20"
  ): TypedContractMethod<[], [bigint], "view">;

  filters: {};
}
