import * as path from "path";
import * as fs from "fs";
import * as program from "commander";
import data from '../data/directories';
import { ILogService, LogService } from "./logService";


export interface IDirectoryService {
    createDirectory(pathName: string): void;
    directoryExists(directoryName: string): boolean;
    findDirectoryByName(directoryName: string): string;
    findDirectory(directory: string): string;
}

export class DirectoryService implements IDirectoryService {
    _logger: ILogService = new LogService();

    createDirectory(pathName: string): void {
        try {
            pathName = pathName.replace('//', '/');
            fs.mkdirSync(pathName);
            this._logger.success(`Created directory: ${pathName}`);
        } catch (error) {
            this._logger.error(`There was an error creating this directory: ${pathName} \n${error}`);
        }
    }

    directoryExists(directoryName: string): boolean {
        try {
            return fs.statSync(directoryName).isDirectory();
        } catch (err) {
            return false;
        }
    }

    findDirectoryByName(directoryName: string): string {
        let directory: string;

        if (directoryName) {
            directory = data.directories.find(x => {
                return x.toLowerCase().includes(directoryName.toLowerCase());
            });
        }

        return directory;
    }

    findDirectory(directory: string): string {
        let pathToDirectory = '';

        if (this.directoryExists(`./${directory}`)) {
            pathToDirectory = `./${directory}`;
        } else {
            data.styleTypes.forEach(x => {
                if (this.directoryExists(`./src/${x}/${directory}`)) {
                    pathToDirectory = `./src/${x}/${directory}`;
                }
            });
        }

        return pathToDirectory;
    }
}