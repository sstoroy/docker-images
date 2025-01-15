const Fs = require('fs');
const Path = require('path');
const AdmZip = require('adm-zip');

const srcPath = "./src/assets/apps"
const dstPath = "./dist/assets/files"

function msg(msg) {console.log("[BuildDockerArchive] " + msg);}
function err(errMsg) {msg("ERROR " + errMsg);}
const appFolderParent = (appName) => Path.join(srcPath, appName); 
const appFolderForVersion = (appName, appVersion) => Path.join(appFolderParent(appName), appVersion); 
const fileSaveLocation = (fileName) => Path.join(dstPath, fileName); 
const appNameAndVersion = (appName, appVersion) => appName + "-" + appVersion;

function getFilesInDirectory(folder) {
    try {
        const contents = Fs.readdirSync(folder);
        const files = contents.filter(item => {
            const itemPath = Path.join(folder, item);
            return Fs.statSync(itemPath).isFile(); 
        });
        return files;
    } catch (error) {
        err(`reading directory ${appName} due to ${error.message}`);
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
        err(`reading directory ${appName} due to ${error.message}`);
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
        const fileName = appNameAndVersion(appName, appVersion);
        msg("Writing file " + fileName);
        zip = new AdmZip();
        zip.addZipComment(fileSaveLocation(fileName));
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
            appFile.writeZip(fileName + ".zip");
            writtenFiles.push(appFile);
        } catch (error) {
            err(`writing file ${fileName} due to ${error.message}`);
        }
    })
    return writtenFiles;
}

function getDockerFileTemplates() {
    let files = getFilesInDirectory(appFolderParent("docker"));
    return files;
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
        const replacement = zip.getZipComment();
        const originalContents = Fs.readFileSync("./src/assets/apps/docker/" + template, 'utf8');
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
    const latestVersionFileName = appFiles[appFiles.length-1].getZipComment() + ".zip";

    appFiles = writeFiles(appFiles);
    msg(`Created ${appFiles.length} out of ${appVersions.length} possible for ${appName}`);
    if (appFiles.length != appVersions.length) return "";
    return appNameAndVersion(appName, appVersions[appVersions.length-1]) + ".zip";
}

module.exports = appName => build(appName)