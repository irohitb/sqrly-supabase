interface WatchArgs {
    sourcePath: string;
    fileChanged: (path: string) => void;
    log: (message?: any, ...optionalParams: any[]) => void;
}
export declare function watchPath({ sourcePath, fileChanged, log }: WatchArgs): void;
export {};
