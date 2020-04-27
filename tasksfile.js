const { sh, cli } = require('tasksfile')
const fs = require('fs')
const path = require('path')

function release(options, vendor, extension) {
    console.log(`Releasing ${vendor}/${extension}`)

    console.log(`Building extension tasks..`)
    const tasksRoot = path.join(__dirname, vendor, extension, 'tasks')
    
    const taskSourcePaths = fs.readdirSync(tasksRoot, { withFileTypes: true})
      .filter(f => f.isDirectory())
      .map(d => path.join(tasksRoot, d.name))
    for (let taskSourcePath of taskSourcePaths) {
      sh(`cd ${taskSourcePath} && npm ci && npm run build`)
    }
    
    console.log(`Packaging extension..`)
    const extensionRoot = path.join(__dirname, vendor, extension)
    sh(`tfx extension create --root ${extensionRoot} --rev-version --manifest-globs vss-extension.json --output-path packages`)
}

cli({
  release
})