const fs = require('fs');
const yaml = require('js-yaml');

const { promptUser, createString } = require('./ui.js');

const SOURCE = process.argv[2] ? process.argv[2] : 'global-config/env.yaml'

function loadYaml(path) {
    const yamlContents = fs.readFileSync(path)
    return yaml.load(yamlContents)
}

function writeYaml(outputObjects) {
    for (let [path, obj] of Object.entries(outputObjects)) {
        const newYaml = yaml.dump(obj)
        fs.writeFileSync(path, newYaml)        
    }
}

// Function to be called from inside a node project to load environment variables
function getEnvironment(path) {
    try {
        const environment = loadYaml(path)
        return environment.variables
    } catch (error) {
        console.error(error.message)
        return
    }
}

class Environment {
    constructor() {
        this.currENV = loadYaml(SOURCE)
        this.ENV_NAMES = this.currENV.environmentKeys
        this.IGNORE_KEYS = this.currENV.ignoreKeys
        
        this.output = {}
        this.outputObjects = {}
        this.environmentObjects = []
    }

    async main() {
        for (let currPath of this.currENV.paths) {
            let currFile = loadYaml(currPath)
            this.getEnvironmentObjects(currFile)
            for (let obj of this.environmentObjects) {
                const valueUpdates = this.updateENV(obj, this.currENV.variables)
                if (valueUpdates) {
                    this.output[currPath] = { ...this.output[currPath], ...valueUpdates }
                }
            }
            this.outputObjects[currPath] = currFile
            this.environmentObjects = []
        }
        
        const response = await promptUser(this.output)
        if (response === 'confirmed') {
            writeYaml(this.outputObjects)
            console.log('Changes written')
        } else if (response === 'empty') {
            console.log('Already up to date')
        } else {
            console.log('No Changes written')
        }
    }

    // Checks the current object for variables that matches any variables in the source file
    updateENV(env, newVars) {
        for (let vars of Object.keys(newVars)) {
            if (Object.hasOwn(env, vars) && env[vars] != newVars[vars]) {
                let stringOutput = createString(vars, env[vars], newVars[vars])
                env[vars] = newVars[vars]
                return stringOutput
            }
        }
    }

    // Check if current object contains an object with a key name matching any environment keys in source file
    checkValidEnvName(obj) {
        for (let variation of this.ENV_NAMES) {        
            if (Object.hasOwn(obj, variation)) {
                return variation
            }
        }
        return false
    }    

    // A recursive function that loads any object with a key matching the environent keys fromthe sourcefile
    // Ignores any keys specified in ignoreKeys
    getEnvironmentObjects(currObj) {
        const envName = this.checkValidEnvName(currObj)
        if (envName) {
            this.environmentObjects.push(currObj[envName])
        }
        for (let keys in currObj) {
            if (typeof currObj[keys] === 'object' && !this.IGNORE_KEYS.includes(keys)) {
                this.getEnvironmentObjects(currObj[keys])
            } else {
                continue
            }
        }
    }
}

if (require.main === module) {
    const currentEnvironment = new Environment()
    currentEnvironment.main()
}

module.exports = {
    getEnvironment
}

// todo
// integrate with npm/server