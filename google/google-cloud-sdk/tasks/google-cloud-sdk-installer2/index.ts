import * as tasks from 'azure-pipelines-task-lib';
import * as tools from 'azure-pipelines-tool-lib';
import * as os from 'os';
import * as path from 'path';

async function run() {
    let version = getVersion();
    await install(version);
    setConfigurationDirectory();
}

// This function is required to convert the version 1.10 to 1.10.0.
// Because caching utility accept only semantic version,
// which have patch number as well.
function getVersion(): string {
    let version = tasks.getInput('version', true)!;

    let versionPart = version.split(".");
    if (versionPart[1] == null) {
        // append minor and patch version if not available
        return version.concat(".0.0");
    }
    else if (versionPart[2] == null) {
        // append patch version if not available
        return version.concat(".0");
    } 

    return version;
}

async function install(version: string) {
    // Install
    let toolPath = tools.findLocalTool('google-cloud-sdk', version);

    if (!toolPath) {
        toolPath = await downloadCloudSDK(version);
        tasks.debug("google-cloud-sdk tool is cached under " + toolPath);
    }

    toolPath = path.join(toolPath, 'bin');
    tools.prependPath(toolPath);
}

function setConfigurationDirectory() {
    // Store tool configuration folder in job-specific folder.
    let configPath = tasks.getVariable("CLOUDSDK_CONFIG");
    if (configPath) {
        console.log(`Reusing google-cloud-sdk configuration directory: ${configPath} (from CLOUDSDK_CONFIG)`);
    } else {
        let tempPath = tasks.getVariable('Agent.TempDirectory');
        if (!tempPath) {
            throw new Error("Expected Agent.TempDirectory to be set");
        }

        console.log(`Configured google-cloud-sdk configuration directory: ${tempPath}`);
        tasks.setVariable("CLOUDSDK_CONFIG", tempPath);
    }
}

async function downloadCloudSDK(version: string): Promise<string> {
    let fileName = getFileName(version);
    let downloadUrl = getDownloadUrl(fileName);

    let downloadPath;
    try {
        downloadPath = await tools.downloadTool(downloadUrl);
    } catch (error) {
        tasks.debug(error);
        throw `Failed to download version ${version}. Please verify that the version is valid and resolve any other issues. ${error}`;
    }

    let extPath;
    if (fileName.endsWith('.zip')) {
        extPath = await tools.extractZip(downloadPath);
    }
    else {
        extPath = await tools.extractTar(downloadPath);
    }

    let toolRoot = path.join(extPath, "google-cloud-sdk");
    return await tools.cacheDir(toolRoot, 'google-cloud-sdk', version);
}

// Note: Python is pre-installed on hosted agents, therefore 
// the bundled archive is not needed.
function getFileName(version: string): string {
    let platform: string;
    let architecture: string;

    switch(os.type()) {
        case "Darwin":
            platform = "darwin";
            break;
        
        case "Linux":
            platform = "linux";
            break;
        
        case "Windows_NT":
            platform = "windows";
            break;
        
        default:
            throw `Operating system ${os.type()} is not supported`;
    }

    switch(os.arch()) {
        case "x64":
            architecture = "x86_64";
            break;
        
        case "x32":
            architecture = "x86";
            break;
        
        default:
            throw `Architecture ${os.arch()} is not supported`;
    }

    let ext = platform == "windows" ? "zip" : "tar.gz";
    return `google-cloud-sdk-${version}-${platform}-${architecture}.${ext}`;
}

function getDownloadUrl(filename: string): string {
    return `https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/${filename}`;
}

run().catch(reason => tasks.setResult(tasks.TaskResult.Failed, reason));