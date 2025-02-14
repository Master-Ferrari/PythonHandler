import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { TextEncoder } from "util";
import { format, print, printD, printE } from "ferrari-console-utils";
import { existsSync } from "fs";

interface PythonCommunicatorOptions {
    pythonPronoun?: string;
    onData?: (data: string) => any;
    onError?: (error: string) => any;
    onClose?: (code: number | null) => any;
    logging?: boolean;
}

export class PythonCommunicator {
    private pythonProcess: ChildProcessWithoutNullStreams;

    private logging: boolean = true;
    private pyFilePath: string;
    private pythonPronoun: string = "python";

    set(opt: PythonCommunicatorOptions) {
        this.logging = opt?.logging ?? true;
        if (opt.pythonPronoun) this.pythonPronoun = opt.pythonPronoun;

        this.pythonProcess.stdout.removeAllListeners("data");
        this.pythonProcess.stderr.removeAllListeners("data");
        this.pythonProcess.removeAllListeners("close");

        const _onData = (data: string) => {
            this.printFromPython(data);
            opt?.onData?.(data);
        };

        const _onError = (error: string) => {
            this.errorFromPython(this.pyFilePath + ": ", error);
            opt?.onError?.(error);
        };

        const _onClose = (code: number | null) => {
            this.printFromPython(this.pyFilePath + " closed with code " + code);
            opt?.onClose?.(code);
        };

        this.pythonProcess.stdout.on("data", (data) => {
            data = this.decodeFromNumbers(data.toString());
            _onData(String(data));
        });

        this.pythonProcess.stderr.on("data", (data) => {
            _onError(String(data));
        });

        this.pythonProcess.on("close", (code) => {
            _onClose(code);
        });
    }

    constructor(pyFilePath: string, opt?: PythonCommunicatorOptions) {
        if (!existsSync(pyFilePath)) {
            throw new Error(`File does not exist at path: ${pyFilePath}`);
        }
        this.pyFilePath = pyFilePath;

        this.printFromPython("Process started (" + pyFilePath + ")");
        this.pythonProcess = spawn(this.pythonPronoun, [pyFilePath]);

        if (opt) {
            this.set(opt);
        }

        // printD({pythonProcess: this.pythonProcess});

    }

    private stringToUint8Array(inputString: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(inputString);
    }

    private encodeToNumbers(text: string): string {
        return text.split("").map(char => char.charCodeAt(0)).join(",");
    }

    private decodeFromNumbers(text: string): string {
        const numbers = text.split(",").map(Number);
        return String.fromCharCode(...numbers);
    }

    private printFromPython(string: string): void {
        if (!this.logging) return;
        print("PYTHON message to node: " + format(string, { foreground: "blue" }));
    }

    private errorFromPython(string: string, error: string): void {
        if (!this.logging) return;
        print("Python ERROR: " + format(string + "\n" + error, { foreground: "red" }));
    }

    send(msg: string): void {
        print("NODE message to python: " + format(msg, { fg: "green" }));
        try {
            this.pythonProcess.stdin.write(this.stringToUint8Array(this.encodeToNumbers(msg) + "\n"));
        } catch (error) {
            printE("Error sending message:", error);
        }
    }

    close(): void {
        this.pythonProcess.stdin.end();
    }
}


