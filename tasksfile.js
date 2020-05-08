const { sh, cli } = require('tasksfile')
const fs = require('fs')
const path = require('path')

function release(options, vendor, extension, manifest) {
    console.log(`Releasing ${vendor}/${extension}`)

    const releaseManifest = manifest ? manifest : 'vss-extension.json';
    console.log(`Manifest: ${releaseManifest}`)

    console.log(`Building extension tasks..`)
    const tasksRoot = path.join(__dirname, vendor, extension, 'tasks')
    
    const taskSourcePaths = fs.readdirSync(tasksRoot, { withFileTypes: true})
      .filter(f => f.isDirectory())
      .map(d => path.join(tasksRoot, d.name))
    for (let taskSourcePath of taskSourcePaths) {
      sh(`cd ${taskSourcePath} && npm ci`)
      sh(`cd ${taskSourcePath} && npm run build`)
      sh(`cd ${taskSourcePath} && rm -rf node_modules/ && npm ci --only=production`)
    }
    
    console.log(`Packaging extension..`)
    const extensionRoot = path.join(__dirname, vendor, extension)
    sh(`tfx extension create --root ${extensionRoot} --rev-version --manifest-globs ${releaseManifest} --output-path packages`)
}

cli({
  release
})