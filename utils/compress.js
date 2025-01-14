const Fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const srcPath = "./src/assets/apps"
const dstPath = "./dist/assets/files"

const msg = (msg) => "[Compress] " + msg;

function getAppFolder(appName) {
    return `${srcPath}/${appName}/`;
}

function getFoldersInDirectory(appName) {
    try {
        const versions = getAppFolder(appName);
        const contents = Fs.readdirSync(versions);

        const folders = contents.filter(item => {
            const itemPath = path.join(versions, item);
            return Fs.statSync(itemPath).isDirectory(); 
        });

        return folders;
    } catch (error) {
        console.error(msg(`Error reading directory ${appName}: ${error.message}`));
        return [];
    }
}

function zipFolders(appName, versions) {
    let fileName;
    versions.forEach( (version) => {
        const folderPath = `/${appName}/${version}`;
        fileName = `${appName}-${version}.zip`;
        console.log(msg("Writing file " + fileName));
        zipFolder(`${srcPath}/${folderPath}`, fileName);
    });
    return fileName;
}

function zipFolder(folderPath, fileName) {
    const filePath = `${dstPath}/${fileName}`;

    try {
        let zip = new AdmZip();
        zip.addLocalFolder(folderPath);
        zip.writeZip(filePath);
    } catch (error) {
        console.error(msg(`Error writing file ${filePath}: ${error.message}`));
    }
}

function compress(appName) {
    const versions = getFoldersInDirectory(appName);
    const compressed = zipFolders(appName, versions);
    return compressed;
}

module.exports = appName => compress(appName)