import * as program from "commander";
import { FileService, IFileService } from "../services/fileService";
import { IWebPak, WebPack } from "../options/webPack";
import { IGulp, Gulp } from "../options/gulp";
import { IGrunt, Grunt } from "../options/grunt";
import { IParcel, Parcel } from "../options/parcel";
import { IPostCssConfig, PostCssConfig } from "../options/postCss";
import { ILogService, LogService } from "../services/logService";
import { IDirectoryService, DirectoryService } from "../services/directoryService";
import { IShellService, ShellService } from '../services/shellService'
import data from "../data/directories";

export interface INewProject {
    createNewProject(): void;
}

export class NewProject implements INewProject {
    _fileService: IFileService = new FileService();
    _projectDependencies: string = '';
    _devDependencies: string[] = [];
    _projectCommands: string = '';
    _logService: ILogService = new LogService();
    _directoryService: IDirectoryService = new DirectoryService();
    _shellService: IShellService = new ShellService();
    _styleRootPath: string = '';

    createNewProject(): void {
        let projectName = program.args[1] || '';
        if (!program.only) {
            this.createScriptScaffolding(projectName);
            this.createTaskRunner(projectName);
            this.createPackageJson(projectName);
            this.createIndexHtml(projectName);
        }
        this.createStyleScaffolding(projectName);
        this.displayStartupInstructions(projectName);
    }

    createScriptScaffolding(projectName: string) {
        let extension = this._fileService.getFileExtension(null);
        let styleFormat = this._fileService.getStyleFormat(extension);
        this._styleRootPath = `./src/${styleFormat}/styles${extension}`;
        let mainContents = this.isWebPack ? `import '../${styleFormat}/styles${extension}';` : '';
        if (projectName) {
            this._directoryService.createDirectory(projectName);
        }

        this._directoryService.createDirectory(`./${projectName}/build`);
        this._directoryService.createDirectory(`./${projectName}/src`);
        this._directoryService.createDirectory(`./${projectName}/src/scripts`);
        this._directoryService.createDirectory(`./${projectName}/src/scripts/components`);
        this._directoryService.createDirectory(`./${projectName}/src/scripts/services`);
        this._fileService.saveFile(`./${projectName}/src/scripts/main.js`, mainContents);
    }

    isWebPack(): boolean {
        switch (true) {
            case program.gulp:
                return false;
            case program.grunt:
                return false;
            case program.parcel:
                return false;
            default:
                return true;
        }
    }

    createStyleScaffolding(projectName: string) {
        let extension = this._fileService.getFileExtension(null);
        let rootPath = this.createStyleRootDirectory(projectName, extension);
        let importStatements = this.createStyleDirectories(rootPath, extension);
        this.createRootManifest(rootPath, extension, importStatements);
    }

    createStyleRootDirectory(projectName: string, extension: string): string {
        let rootPath = './';
        if (!program.only) {
            extension = this._fileService.getStyleFormat(extension);
            rootPath = `./${projectName}/src/${extension}`;
            this._directoryService.createDirectory(rootPath);
        }
        return rootPath;
    }

    createStyleDirectories(rootPath: string, extension: string): string {
        let importStatements = '';

        data.directories.forEach((dir, i) => {
            this._directoryService.createDirectory(`${rootPath}/${dir}`);
            this._fileService.saveFile(`${rootPath}/${dir}/index${extension}`, '');
            importStatements += `@import './${dir}/index${extension}';\n`;
        });

        return importStatements
    }

    createRootManifest(rootPath: string, extension: string, importStatements: string): void {
        this._fileService.saveFile(`${rootPath}/styles${extension}`, importStatements);
    }

    createPackageJson(projectName: string) {
        let configProjectName = projectName || 'your_project_name';
        let config: any = {
            "name": configProjectName,
            "version": "0.1.0",
            "description": "",
            "main": "index.js",
            "scripts": {},
            "keywords": [],
            "author": "",
            "license": "ISC",
        };

        config.scripts = this._projectCommands;
        this._fileService.saveFile(`./${projectName}/package.json`, JSON.stringify(config, null, '\t'));
        this._shellService.installNPMDependencies(projectName, this._devDependencies, true);
    }

    createTaskRunner(projectName: string): void {
        let postCss: IPostCssConfig = new PostCssConfig();
        switch (true) {
            case program.grunt:
                let grunt: IGrunt = new Grunt();
                grunt.createGruntfile(projectName);
                this._devDependencies = grunt.createGruntDependencies();
                this._projectCommands = grunt.createProgramCommands();
                break;
            case program.gulp:
                let gulp: IGulp = new Gulp();
                gulp.createGulpfile(projectName);
                this._devDependencies = gulp.createGulpDependencies();
                this._projectCommands = gulp.createProgramCommands();
                postCss.createPostCssConfig(projectName);
                break;
            case program.parcel:
                let parcel: IParcel = new Parcel();
                this._devDependencies = parcel.createParcelDependencies();
                this._projectCommands = parcel.createProgramCommands();
                postCss.createPostCssConfig(projectName);
                break;
            default:
                let webPack: IWebPak = new WebPack();
                webPack.createWebPackConfig(projectName);
                this._devDependencies = webPack.createWebPackDependencies();
                this._projectCommands = webPack.createProgramCommands();
                postCss.createPostCssConfig(projectName);
                break;
        }
    }

    createIndexHtml(projectName: string) {
        let jsDir = program.parcel ? './src/scripts/main.js' : './build/scripts.js';
        let cssDir = program.parcel ? this._styleRootPath : './build/styles.css';
        let contents = '<html lang="en">\n'
            + '\n'
            + '<head>\n'
            + '    <meta charset="UTF-8">\n'
            + '    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">\n'
            + '    <meta http-equiv="X-UA-Compatible" content="ie=edge">\n'
            + '    <title>Clarion</title>\n'
            + `    <link rel="stylesheet" href="${cssDir}">\n`
            + '</head>\n'
            + '\n'
            + '<body>\n'
            + '    <h1>Congratulations! You did it!</h1>\n'
            + '    <img src="https://media.giphy.com/media/2xO491sY6f0cM/giphy.gif" alt="tobias huzzah!">\n'
            + '    <h2>This page is intentionally ugly!</h2>\n'
            + '    <p>Create some styles and start having fun!</p>\n'
            + '    <ul>\n'
            + '         <li>Modify headings by creating a headings file: <code>clarion add element headings</code>.</li>\n'
            + '         <li>Modify paragraphs by creating a paragraphs file: <code>clarion add element paragraphs</code>.</li>\n'
            + '    </ul>\n'
            + '    <h3>Here is some sweet, sweet dummy text to play with. Enjoy!</h3>\n'
            + '    <p>Bacon ipsum dolor amet ball tip hamburger adipisicing chicken prosciutto non. Shoulder venison quis, flank leberkas turducken dolor tenderloin nostrud. Ham strip steak swine boudin tempor. Shoulder doner mollit brisket. Cillum strip steak picanha kevin et culpa commodo lorem pastrami.</p>\n'
            + '    <p>Elit est ut prosciutto sausage spare ribs tenderloin pork loin cupidatat brisket dolore pancetta occaecat. Elit meatball leberkas burgdoggen ham hock beef ribs ut bresaola voluptate pork belly eu culpa t-bone esse pork loin. Quis corned beef minim eu velit excepteur. Quis consequat bacon corned beef boudin chicken anim sint labore kielbasa do ipsum sed. Frankfurter laborum turkey do brisket elit exercitation adipisicing doner irure jowl leberkas. Culpa flank kevin drumstick sunt porchetta kielbasa pancetta picanha ea dolor ad. Irure tongue in pork belly alcatra sirloin mollit reprehenderit tri-tip dolore.</p>\n'
            + '    <p>Id tri-tip meatball pork belly, mollit burgdoggen leberkas cupim. Do nostrud sirloin jerky capicola ham hock deserunt, spare ribs pork belly boudin culpa salami in duis. Biltong ut aute chuck nostrud drumstick short ribs et ham hock in lorem. Prosciutto exercitation salami in enim. Laborum shoulder ribeye kielbasa exercitation bacon officia ut alcatra rump pork turkey. Excepteur ut voluptate, qui labore est pork chop pastrami hamburger cupim laborum doner shank.</p>\n'
            + `    <script src="${jsDir}"></script>\n`
            + '</body>\n'
            + '\n'
            + '</html>\n';

        this._fileService.saveFile(`./${projectName}/index.html`, contents);
    }

    displayStartupInstructions(projectName: string): void {
        if (!program.only) {
            this._logService.info('\nTo get started run the following command:');
            if (projectName) this._logService.info(`cd ${projectName}`);
            this._logService.info('npm run dev');
        }
    }
}