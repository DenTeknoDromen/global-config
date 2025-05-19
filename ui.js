const readLine = require('node:readline');

const orange = '\x1b[33m'
const turnOffColor = '\x1b[0m'
const green = '\x1b[32m'
const dim = '\x1b[2m'

// Creates a string used for UI output
function createString(key, valueA, valueB) {
    const stringOutput = {}
    stringOutput[key] = `${valueA}-${valueB}`
    return stringOutput
}

const question = (str, rl) => new Promise(resolve => rl.question(str, resolve))

async function promptUser(output) {
    const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
    });
    
    if (Object.keys(output).length === 0) {
        rl.close()
        return 'empty'
    }
    console.log(`${orange}%s`, 'The following values will be overwritten:\n')
    for (let [path, values] of Object.entries(output)) {
        console.log(`${orange}%s`, `${path}`)
        
        for (let [key, change] of Object.entries(values)) {
            const changes = change.split('-')
            console.log(`\t${turnOffColor}%s: ${dim}%s${turnOffColor} ---> ${green}%s${turnOffColor}`, key, changes[0], changes[1])
        }
    }

    let response = await question('\nCommit changes? y/n ', rl)
    rl.close()
    if ((response.match(/^y$|^yes$|^Y$|^Yes$|^YES$|/)[0])) {
        return 'confirmed'
    } else {
        return 'aborted'
    }
}

module.exports = {
    promptUser,
    createString
}