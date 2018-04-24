'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "end-ts" is now active!');

    vscode.workspace.registerFileSystemProvider('datei', new DateiFileSystemProvider(), {
        isCaseSensitive: false
    });
}

namespace Promisify {

    function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error, result: T): void {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    }

    export function readdir(path: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(path, (error, children) => handleResult(resolve, reject, error, children));
        });
    }

    export function stat(path: string): Promise<fs.Stats> {
        return new Promise<fs.Stats>((resolve, reject) => {
            fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
        });
    }
}

class DateiFileSystemProvider implements vscode.FileSystemProvider {

    private _onDidChangeFile: vscode.EventEmitter<vscode.FileChangeEvent[]>;

    constructor() {
        this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    }

    get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
        return this._onDidChangeFile.event;
    }

    stat(uri: vscode.Uri, options: {}, token: vscode.CancellationToken): vscode.FileStat | Thenable<vscode.FileStat> {
        return this._stat(uri.fsPath, options, token);
    }

    async _stat(path: string, options: {}, token: vscode.CancellationToken): Promise<vscode.FileStat> {
        return new FileStat(await Promisify.stat(path));
    }

    readFile(uri: vscode.Uri, options: vscode.FileOptions, token: vscode.CancellationToken): Uint8Array | Thenable<Uint8Array> {
        throw new Error("Method not implemented.");
    }

    readDirectory(uri: vscode.Uri, options: {}, token: vscode.CancellationToken): Thenable<any[]> {
        return this._readDirectory(uri, options, token);
    }

    async _readDirectory(uri: vscode.Uri, options: {}, token: vscode.CancellationToken): Promise<vscode.FileStat[]> {
        const children = await Promisify.readdir(uri.fsPath);

        const stats: vscode.FileStat[] = [];
        for (let i = 0; i < children.length; i++) {
            stats.push(await this._stat(path.join(uri.fsPath, children[i]), {}, token));
        }

        return Promise.resolve(stats);
    }

    createDirectory(uri: vscode.Uri, options: {}, token: vscode.CancellationToken): vscode.FileStat | Thenable<vscode.FileStat> {
        throw new Error("Method not implemented.");
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: vscode.FileOptions, token: vscode.CancellationToken): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }

    delete(uri: vscode.Uri, options: {}, token: vscode.CancellationToken): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: vscode.FileOptions, token: vscode.CancellationToken): vscode.FileStat | Thenable<vscode.FileStat> {
        throw new Error("Method not implemented.");
    }

    watch(uri: vscode.Uri, options: { recursive?: boolean | undefined; excludes?: string[] | undefined; }): vscode.Disposable {
        throw new Error("Method not implemented.");
    }
}

export function deactivate() {
}

export class FileStat implements vscode.FileStat {

    isFile: boolean | undefined;
    isDirectory: boolean | undefined;
    isSymbolicLink: boolean | undefined;
    size: number;
    mtime: number;

    constructor(fsStat: fs.Stats) {
        this.isFile = fsStat.isFile();
        this.isDirectory = fsStat.isDirectory();
        this.isSymbolicLink = fsStat.isSymbolicLink();
        this.size = fsStat.size;
        this.mtime = fsStat.mtime.getTime();
    }
}