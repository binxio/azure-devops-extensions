/**
   Copyright 2010 binx.io B.V.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
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
