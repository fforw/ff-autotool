const fs = require("fs")
const path = require("path")
const shelljs = require("shelljs")
module.exports = function create(schemaPath)
{
    if (fs.existsSync(schemaPath))
    {
        console.error("Cannot create schema" + schemaPath + ": File does already exist.")
    }

    return new Promise(
        resolve => {
            shelljs.cp(
                path.resolve(__dirname, "../domain/new.graphql"),
                schemaPath
            )
            resolve()
        }
    )
}
