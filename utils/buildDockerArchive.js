const Fs = require('fs');
const Path = require('path');
const AdmZip = require('adm-zip');

const msg = (msg) => console.log("[BuildDockerArchive] " + msg);
const err = (errMsg) => msg("ERROR " + errMsg);

const assetsSrc = "./src/assets/"
const assetsDst = "./dist/assets/archives"

const appNameAndVersion = (appName, appVersion) => appName + "-" + appVersion;
const appFolderParent = (appName) => Path.join(assetsSrc, "apps", appName); 
const appFolderForVersion = (appName, appVersion) => Path.join(appFolderParent(appName), appVersion); 
const archiveSaveLocation = (fileName) => Path.join(assetsDst, fileName); 
const templatesFolder = Path.join(assetsSrc, "scripts", "templates");

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

function zipAppFolders(appName, appVersions) {
    let zipFiles = [];
    appVersions.forEach(appVersion => {
        let zip = createZipFromFolder(appName, appVersion);
        if (zip) zipFiles.push(zip);
    });
    return zipFiles;
}

function createZipFromFolder(appName, appVersion) {
    try {
        const folderPath = appFolderForVersion(appName, appVersion);
        const fileName = appNameAndVersion(appName, appVersion) + ".zip";
        msg("Writing file " + fileName);
        zip = new AdmZip();

        // store the future location and filename as a comment
        zip.addZipComment(archiveSaveLocation(fileName)); 

        zip.addLocalFolder(folderPath);
        return zip;
    } catch (error) {
        err(`zipping folder ${folderPath} due to ${error.message}`);
    }
}

function writeFiles(appFiles) {
    let writtenFiles = [];
    appFiles.forEach(appFile => {
        let fileName = appFile.getZipComment();
        try {
            appFile.addZipComment("");
            appFile.writeZip(fileName);
            writtenFiles.push(appFile);
        } catch (error) {
            err(`writing file ${fileName} due to ${error.message}`);
        }
    })
    return writtenFiles;
}

function getDockerFileTemplates() {
    return getFilesInDirectory(templatesFolder);
}

function addDockerFiles(appFiles) {
    const templates = getDockerFileTemplates();
    let addedDockerFiles = [];
    appFiles.forEach(appFile => {
        let success = true;
        templates.forEach(template => {
            if (!(addTemplateToZip(appFile, template))) success = false;
        });
        if (success) addedDockerFiles.push(appFile);
    });
    return addedDockerFiles;
}

function addTemplateToZip(zip, template) {
    try {
        const toReplace = "{{ filename }}";
        let replacement = Path.parse(zip.getZipComment()).base;
        replacement = replacement.substring(0, replacement.lastIndexOf("."));

        const originalContents = Fs.readFileSync(Path.join(templatesFolder, template), 'utf8');
        const modified = originalContents.replace(new RegExp(toReplace, 'g'), replacement);

        zip.addFile(template, Buffer.from(modified, 'utf8'));

        return zip;
    } catch (error) {
        err(`adding template ${template} to ${zip} due to ${error}`);
    }
}

function build(appName) {
    const appVersions = getFoldersInDirectory(
        appFolderParent(appName)
    );
    
    let appFiles = zipAppFolders(appName, appVersions);
    appFiles = addDockerFiles(appFiles);
    appFiles = writeFiles(appFiles);
    msg(`Created ${appFiles.length} out of ${appVersions.length} possible for ${appName}`);

    if (appFiles.length != appVersions.length) return "";
    return appNameAndVersion(appName, appVersions[appVersions.length-1]) + ".zip";
}

module.exports = appName => build(appName)