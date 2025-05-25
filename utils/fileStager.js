const Fs = require('fs');
const Path = require('path');
const AdmZip = require('adm-zip');
const slugify = require('slugify')

const textColors = {
    default: '\x1b[39m%s\x1b[0m',
    error: '\x1b[31m%s\x1b[0m',
    warning: '\x1b[33m%s\x1b[0m',
    success: '\x1b[32m%s\x1b[0m',
}

const msg = (msg, color) => console.log(
    color || textColors.default,
    "[FileStager] " + msg);
const err = (errMsg) => msg("ERROR " + errMsg, textColors.error);

const DATA_FOLDER = Path.join(".", "src", "_data");
const APPS_FOLDER = Path.join(DATA_FOLDER, "apps");
const INFO_FILE_NAME = "info.txt";
const DOCKER_TEMPLATES_FOLDER = Path.join(DATA_FOLDER, "dockertemplates");

const folderAction = {
    "file": (appName, appVersion) =>
        copyFirstFile(appName, appVersion),
    "archive": (appName, appVersion) =>
        createArchive(appName, appVersion, "archive"),
    "docker": (appName, appVersion) =>
        createDockerArchive(appName, appVersion),
    "windows": (appName, appVersion) =>
        createArchive(appName, appVersion, "windows"),
    "linux": (appName, appVersion) =>
        createArchive(appName, appVersion, "linux"),
}

const createFileName = (appName, appVersion, suffix, separator, extension) =>
    slugify(appName) +
    separator + appVersion +
    (suffix && suffix.trim() ? separator + suffix.trim() : '') +
    (extension && extension.trim() ? '.' + extension.trim() : '');
const appFolderParent = (appName) =>
    Path.join(APPS_FOLDER, appName);
const appFolderForVersion = (appName, appVersion) =>
    Path.join(appFolderParent(appName), appVersion);
const appFilesForVersionAction = (appName, appVersion, filesAction) =>
    Path.join(appFolderForVersion(appName, appVersion), filesAction);
const preparedFilesDirectory = (fileName) =>
    Path.join(".", "dist", "assets", "downloads", fileName || "");

function readFileAsString(filepath)
    { return Fs.readFileSync(filepath, 'utf8'); }
function createDownloadsFolder()
    { Fs.mkdirSync(preparedFilesDirectory(), { recursive: true }) }

function createFileInfo(appName, appVersion, suffix, extension) {
    return {
        name: createFileName(appName, appVersion, suffix, '_', extension),
        downloadURL: createFileName(appName, appVersion, suffix || "file", '/')
    };
}

function getFilesInDirectory(folder) {
    try {
        const contents = Fs.readdirSync(folder);
        return contents.filter(item => {
            const itemPath = Path.join(folder, item);
            return Fs.statSync(itemPath).isFile(); 
        });
    } catch (error) {
        err(`reading directory ${folder} due to ${error.message}`);
        return [];
    }
}
function getFoldersInDirectory(folder) {
    try {
        const contents = Fs.readdirSync(folder);
        return contents.filter(item => {
            const itemPath = Path.join(folder, item);
            return Fs.statSync(itemPath).isDirectory(); 
        });
    } catch (error) {
        err(`reading directory ${folder} due to ${error.message}`);
        return [];
    }
}
function initializeArchiveObject(folderPath, fileName)
{
    try {
        let zip = new AdmZip("", undefined);
        zip.addLocalFolder(folderPath);
        return {file: zip, name: fileName, templateAdded: undefined};
    } catch (error) {
        err(`zipping folder ${folderPath} to ${fileName} due to ${error.message}`);
    }
}
function tryWriteArchive(archiveObject) {
    const saveDirectory = preparedFilesDirectory(archiveObject.name);
    try {
        archiveObject.file.writeZip(saveDirectory);
        msg(`Created archive ${archiveObject.name}.`);
        return true;
    } catch (error) {
        err(`writing file ${archiveObject.filename} due to ${error.message}`);
    }
    return false;
}
function getDockerFileTemplates() {
    return getFilesInDirectory(DOCKER_TEMPLATES_FOLDER);
}
function tryAddTemplateToArchive(archiveObject, template) {
    if (archiveObject.templateAdded === false) return;

    archiveObject.templateAdded = false;
    try {
        const toReplace = "{{ filename }}";
        let replacement = archiveObject.name;
        replacement = replacement.substring(0, replacement.lastIndexOf("."));

        const originalContents = Fs.readFileSync(
            Path.join(DOCKER_TEMPLATES_FOLDER, template),
            'utf8');
        const modified = originalContents.replace(
            new RegExp(toReplace, 'g'),
            replacement);

        archiveObject.file.addFile(template, Buffer.from(modified, 'utf8'));
        archiveObject.templateAdded = true;
    } catch (error) {
        err(`adding template ${template} to ${archiveObject.name} due to ${error}`);
    }
}
function addTemplatesToArchive(archiveObject) {
    getDockerFileTemplates().forEach(template =>
        tryAddTemplateToArchive(archiveObject, template));
}
function buildAppFiles(appList) {
    appList
        .filter(appObj => appObj.name)
        .forEach(appObj => {
            appObj.files = [];
            if (!appObj.filesToCreate) {
                err(`No files to prepare for ${appObj.name}!`);
                return;
            }
            msg(`Preparing files for ${appObj.name}...`);
            appObj.versions.forEach(version =>
                doActionFromFolderName(appObj, version));
            const textColor =
                appObj.files.length === appObj.filesToCreate
                    ? textColors.success : textColors.warning;
            msg(`Prepared ${appObj.files.length} out of ` +
                `${appObj.filesToCreate} files possible for ${appObj.name}.`
                , textColor);
        });
}
function doActionFromFolderName(appObj, appVersion) {
    const folder = appFolderForVersion(appObj.folderName, appVersion);
    const actions = getFoldersInDirectory(folder);
    appObj.files.push(...actions
        .filter(action => {
            const validAction = action in folderAction;
            if (!validAction)
                err(`'${action}' is not a valid archive type!`);
            return validAction;
        })
        .map(action => folderAction[action](appObj.folderName, appVersion))
        .filter(result => result != null)
    );
}
function copyFirstFile(appName, appVersion) {
    const folderPath = appFilesForVersionAction(appName, appVersion, "file");
    const firstFile = getFilesInDirectory(folderPath)[0];
    const extension = Path.extname(firstFile).slice(1);
    const fileInfo =
        createFileInfo(appName, appVersion, undefined, extension);
    Fs.copyFileSync(Path.join(folderPath, firstFile), preparedFilesDirectory(fileInfo.name));
    msg(`Copied file ${firstFile} to ${fileInfo.name}.`)
    return fileInfo;
}
function createDockerArchive(appName, appVersion)
{
    const suffix = "docker";
    const extension = "zip";
    const folderPath = appFilesForVersionAction(appName, appVersion, suffix);
    const fileInfo =
        createFileInfo(appName, appVersion, suffix, extension);
    let archiveObject =
        initializeArchiveObject(folderPath, fileInfo.name);
    addTemplatesToArchive(archiveObject);
    if (tryWriteArchive(archiveObject))
        return fileInfo;
}

function createArchive(appName, appVersion, suffix) {
    suffix = suffix || "archive";
    const extension = "zip";
    const folderPath = appFilesForVersionAction(appName, appVersion, suffix);
    const fileInfo = createFileInfo(appName, appVersion, suffix, extension);
    let archiveObject =
        initializeArchiveObject(folderPath, fileInfo.name);
    if (tryWriteArchive(archiveObject))
        return fileInfo;
}
function addAppInfoFromFile(appObj) {
    try {
        const infoFile = readFileAsString(
            Path.join(appFolderParent(appObj.folderName), INFO_FILE_NAME)
        ).split('\n');

        // sanity checks
        if (!infoFile) throw new Error("Missing info.txt!");
        if (!infoFile[0].trim()) throw new Error("Missing name in info.txt!"); 

        appObj.name = infoFile[0]; // name is first line
        appObj.slug = slugify(appObj.name);
        appObj.source = infoFile[1]; // source code address is second line
    } catch (error) {
        err(`${appObj.folderName}: ${error.message}`);
    }
}
function addAppVersions(appObj) {
    const versionFolders = getFoldersInDirectory(appFolderParent(appObj.folderName));
    appObj.versions = versionFolders.sort().reverse(); // latest first
    appObj.filesToCreate = appObj.versions.reduce((total, version) => {
        const dirPath = Path.join(appFolderParent(appObj.folderName), version);
        const actions = getFoldersInDirectory(dirPath);
        return total + actions.length;
    }, 0);
}

function populateApps(list) {
    getFoldersInDirectory(APPS_FOLDER)
        .forEach(appFolderName => {
            let appObj = {folderName: appFolderName}
            addAppInfoFromFile(appObj);
            addAppVersions(appObj);
            list.push(appObj);
        })
}

function filterInvalidApps(appList) {
    return appList
        .filter(app => app.name)
        .filter(app => app.files.length);
}


let appFiles = [];
function stageFiles() {
    let apps = [];
    populateApps(apps);
    buildAppFiles(apps);
    apps = filterInvalidApps(apps);

    appFiles = {
        each: apps.map(({ name, slug, versions, source, files }) =>
            ({ name, slug, versions, source, files })),
        stagedFiles: apps.flatMap(app => app.files)
    };
}

module.exports = function() {
        createDownloadsFolder();
        stageFiles();
        return appFiles;
}