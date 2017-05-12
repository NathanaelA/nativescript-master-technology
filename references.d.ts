declare var global: NodeJS.Global;
declare var process: Process;

declare namespace NodeJS {
    interface Global {
        process: Process;
    }
}

interface Process {
    restart(msg?: string): void;
    exit(): void;
    isDebug(): boolean;
    isEmulator(): boolean;
    processMessages(): void;
}

interface Console {
    keys(data: string | {}, printValue?: boolean): void;
}