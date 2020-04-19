import * as fs from 'fs'

const testPath = 'lib/test/test_modules/'
let testsFailed = false

export const failTests = () => testsFailed = true

function runTests(exitOnFail: boolean = false) {
  if(!fs.existsSync('./'+testPath))
    fs.mkdirSync('./'+testPath, { recursive: true })
  for(let file of fs.readdirSync('./'+testPath))
    require('../../'+testPath+file)

  if(testsFailed) {
    console.log()
    if(exitOnFail) process.exit(-1)
  }
}

if(require.main === module) 
  runTests(true)
