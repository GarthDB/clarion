"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const program = require("commander");
const logService_1 = require("./logService");
class FileService {
    constructor() {
        this._logger = new logService_1.LogService();
    }
    saveFile(destination, content) {
        try {
            destination = destination.replace('//', '/');
            fs.writeFileSync(destination, content);
            this._logger.success(`Saved file:        ${destination}`);
        }
        catch (error) {
            this._logger.error(`There was an error saving this file: ${destination} \n${error}`);
        }
    }
    fileExists(fileName) {
        try {
            return fs.statSync(fileName).isFile();
        }
        catch (err) {
            return false;
        }
    }
    getManifestFile(filePath) {
        if (!filePath)
            return undefined;
        let manifestFile;
        fs.readdirSync(filePath).forEach(file => {
            if (file.startsWith('index'))
                manifestFile = file;
        });
        return manifestFile;
    }
    getFileExtension(directory) {
        switch (true) {
            case program.sass:
                return '.sass';
            case program.scss:
                return '.scss';
            case program.less:
                return '.less';
            default:
                return this.getManifestExtension(directory);
        }
    }
    getManifestExtension(directory) {
        let manifest = this.getManifestFile(directory);
        return manifest ? path.extname(manifest) : '.scss';
    }
    updateManifest(fileName, manifestFile) {
        if (this.fileExists(manifestFile)) {
            switch (program.args[0]) {
                case 'add':
                    this.addFileToManifest(fileName, manifestFile);
                    break;
                case 'remove':
                    this.removeFileFromManifest(fileName, manifestFile);
                    break;
                default:
                    this._logger.warning('Sorry, we were not able to process your request.');
                    break;
            }
        }
    }
    addFileToManifest(fileName, manifestFile) {
        fs.appendFileSync(manifestFile, `@import '${fileName}';\n`);
        this._logger.success(`Saved file:        ${fileName} was added to the manifest.`);
    }
    removeFileFromManifest(fileName, manifestFile) {
        let importStatements = this.readFile(manifestFile).split('\n');
        let fileIndex = importStatements.indexOf(`@import '${fileName}';`);
        if (fileIndex < 0) {
            this._logger.warning('File to be removed was not found in your manifest.');
        }
        else {
            importStatements.splice(fileIndex, 1);
            let formattedImportStatements = importStatements.join('\n');
            this.saveFile(manifestFile, formattedImportStatements);
        }
    }
    removeFile(filePath) {
        try {
            if (this.fileExists(filePath)) {
                fs.unlinkSync(filePath);
                this._logger.success(`File removed:      ${filePath}`);
            }
            else {
                this._logger.warning(filePath + ' was not found');
            }
        }
        catch (error) {
            this._logger.error(`There was an error removing this file: ${filePath} \n${error}`);
        }
    }
    readFile(filePath) {
        return this.fileExists(filePath) ? fs.readFileSync(filePath).toString() : '';
    }
    getStyleFormat(extension) {
        return extension.replace('.', '') === 'less' ? 'less' : 'sass';
    }
}
exports.FileService = FileService;
