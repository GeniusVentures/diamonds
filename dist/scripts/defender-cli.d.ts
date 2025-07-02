#!/usr/bin/env node
declare const program: {
    [key: string]: any;
    args: string[];
    version(str: string, flags?: string | undefined): any;
    command(name: string, desc?: string | undefined, opts?: import("commander").CommandOptions | undefined): any;
    arguments(desc: string): any;
    parseExpectedArgs(args: string[]): any;
    action(fn: (...args: any[]) => void): any;
    option(flags: string, description?: string | undefined, fn?: RegExp | ((arg1: any, arg2: any) => void) | undefined, defaultValue?: any): any;
    option(flags: string, description?: string | undefined, defaultValue?: any): any;
    allowUnknownOption(arg?: boolean | undefined): any;
    parse(argv: string[]): any;
    parseOptions(argv: string[]): import("commander").ParseOptionsResult;
    opts(): {
        [key: string]: any;
    };
    description(str: string, argsDescription?: {
        [argName: string]: string;
    } | undefined): any;
    description(): string;
    alias(alias: string): any;
    alias(): string;
    usage(str: string): any;
    usage(): string;
    name(str: string): any;
    name(): string;
    outputHelp(cb?: ((str: string) => string) | undefined): void;
    help(cb?: ((str: string) => string) | undefined): never;
};
export { program as defenderCLI };
//# sourceMappingURL=defender-cli.d.ts.map