const Fs = require('fs');
const Path = require('path');
const AdmZip = require('adm-zip');

const msg = (msg) => console.log("[DockerArchiver] " + msg);
const err = (errMsg) => msg("ERROR " + errMsg);

const DATA_FOLDER = Path.join(".", "src", "_data");
const APPS_FOLDER = Path.join(DATA_FOLDER, "apps");
const INFO_FILE_NAME = "info.txt";
const TEMPLATES_FOLDER = Path.join(DATA_FOLDER, "dockertemplates");

const appNameAndVersion = (appName, appVersion) => appName + "-" + appVersion;
const appFolderParent = (appName) => Path.join(APPS_FOLDER, appName); 
const appFolderForVersion = (appName, appVersion) => Path.join(appFolderParent(appName), appVersion); 
const archiveSaveLocation = (fileName) => Path.join(".", "dist", "assets", "archives", fileName || ""); 


function readFileAsString(filepath) {return Fs.readFileSync(filepath, 'utf8');}
function createArchivesFolder() {Fs.mkdirSync(archiveSaveLocation(), { recursive: true })}

function getFilesInDirectory(folder) {
    try {
        const contents = Fs.readdirSync(folder);
        const files = contents.filter(item => {
            const itemPath = Path.join(folder, item);
            return Fs.statSync(itemPath).isFile(); 
        });
        return files;
    } catch (error) {
        err(`reading directory ${folder} due to ${error.message}`);
        return [];
    }
}

function getFoldersInDirectory(folder) {
    try {
        const contents = Fs.readdirSync(folder);
        const folders = contents.filter(item => {
            const itemPath = Path.join(folder, item);
            return Fs.statSync(itemPath).isDirectory(); 
        });
        return folders;
    } catch (error) {
        err(`reading directory ${folder} due to ${error.message}`);
        return [];
    }
}

function zipAppFolders(appObj) {
    let zipFiles = [];
    appObj.versions.forEach(appVersion => {
        let zip = createZipFromFolder(appObj.shortname, appVersion);
        if (zip) zipFiles.push(zip);
    });
    return zipFiles;
}

function createZipFromFolder(appName, appVersion) {
    const folderPath = appFolderForVersion(appName, appVersion);
    const fileName = appNameAndVersion(appName, appVersion) + ".zip";
    msg("Creating file " + fileName);
    try {      
        zip = new AdmZip();
        zip.addLocalFolder(folderPath);
        return {file:zip, filename: fileName, written:false};
    } catch (error) {
        err(`zipping folder ${folderPath} to ${fileName} due to ${error.message}`);
    }
    
}

function writeFiles(zipObjects) {
    let writtenFiles = [];
    zipObjects.forEach(zipObject => {
        const saveLocation = archiveSaveLocation(zipObject.filename);
        try {
            zipObject.file.writeZip(saveLocation);
            writtenFiles.push(zipObject.filename);
        } catch (error) {
            err(`writing file ${zipObject.filename} due to ${error.message}`);
        }
    })
    return writtenFiles;
}

function getDockerFileTemplates() {
    return getFilesInDirectory(TEMPLATES_FOLDER);
}

function addDockerFiles(zipObjects) {
    const templates = getDockerFileTemplates();
    let addedDockerObjects = [];
    zipObjects.forEach(zipObject => {
        let success = true;
        templates.forEach(template => {
            if (!(addTemplateToZip(zipObject, template))) success = false;
        });
        if (success) addedDockerObjects.push(zipObject);
    });
    return addedDockerObjects;
}

function addTemplateToZip(zipObject, template) {
    try {
        const toReplace = "{{ filename }}";
        let replacement = zipObject.filename;
        replacement = replacement.substring(0, replacement.lastIndexOf("."));

        const originalContents = Fs.readFileSync(Path.join(TEMPLATES_FOLDER, template), 'utf8');
        const modified = originalContents.replace(new RegExp(toReplace, 'g'), replacement);

        zipObject.file.addFile(template, Buffer.from(modified, 'utf8'));

        return zipObject;
    } catch (error) {
        err(`adding template ${template} to ${zipObject.filename} due to ${error}`);
    }
}

function buildAppArchives(appList) {
    appList
        .filter(appObj => appObj.name)
        .forEach(appObj => {
            msg(`Creating archives for ${appObj.name}...`);
            const appArchives = zipAppFolders(appObj); // initialize archive files
            const zipObjects = addDockerFiles(appArchives); // construct template and add them
            const writtenFiles = writeFiles(zipObjects); // write archive files
            msg(`Created ${writtenFiles.length} out of ${appObj.versions.length} archives possible for ${appObj.name}`);
            appObj.files = writtenFiles;
    });
}

function addAppInfoFromInfoFile(appShortname, appObj) { 
    try {
        const infoFile = readFileAsString(
            Path.join(appFolderParent(appShortname), INFO_FILE_NAME)
        ).split('\n');
        // sanity checks
        if (!infoFile) throw new Error("Missing info.txt!");
        if (!infoFile[0].trim()) throw new Error("Missing name in info.txt!"); 

        appObj.name = infoFile[0]; // name is first line
        appObj.source = infoFile[1]; // source code address is second line
    } catch (error) {
        err(`${appShortname}: ${error.message}`);
    }
}

function addAppInfoVersions(appShortname, appObj) {
    const appVersions = getFoldersInDirectory(appFolderParent(appShortname))
            .sort().reverse(); // latest first
    
    appObj.versions = appVersions;
}

function addAppInfoTo(appShortname, appObj) {
    addAppInfoFromInfoFile(appShortname, appObj);
    addAppInfoVersions(appShortname, appObj);    
}

function addAllAppsInfoTo(list) {
    getFoldersInDirectory(APPS_FOLDER)
        .forEach(appShortname => {
            let appObj = {"shortname": appShortname}

            addAppInfoTo(appShortname, appObj);
            list.push(appObj);
        })
}

// "main" function
function archiveApps() { 
    let apps = [];
    addAllAppsInfoTo(apps);
    buildAppArchives(apps);
    apps = apps.filter(app => app.name); // discard failed archives
    return {each: apps, archiveFiles: apps.flatMap(app => app.files)};
}

module.exports = function () {
    createArchivesFolder();
    return archiveApps();
}