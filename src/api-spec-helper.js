#!/usr/bin/env node

const arg = require('arg');
const status = require('./http-status-codes.json')

module.exports = generateStub, addPath, sendHelpMessage;

process.on('exit', (code) => {
  if (code != 0) {
    console.log(`About to exit with code: ${code}`)
  };
});

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'DELETE']
const DEFAULT_RESPONSE_CODES = ['200', '204', '404', '400']

const ARGS = arg({
  // types
  '--help': Boolean,
  '--generate-stub': Boolean,
  '--add-path': Boolean,
  '--paths': String,
  '--tag': String,
  '--methods': String,
  '--responses': String,
  '--file': String,
  '--name': String,

  // aliases
  '-h': '--help',
  '-a': '--add-path',
  '-p': '--paths',
  '-t': '--tag',
  '-m': '--methods',
  '-r': '--responses',
  '-f': '--file',
  '-g': '--generate-stub',
  '-n': '--name'
})


function sendHelpMessage(){
  let message = `api-spec-helper command references:
  -h      --help                        Display this help message.
  
  -a      --add-path                    Adds routes to specific paths. Expects arguments:
  -p        --paths=users,estates         Specify which paths will be documented.
  -t        --tag='Admin Panel'           Specify a single tag to the generated paths.
  -m        --methods=GET,PUT,DELETE      Specify which methods will be generated. Defaults to all 4.
  -r        --responses=200,203           Specify HTTP status codes for responses. Defaults to 200, 204, 401 & 404.
  
  -g       --generate-stub                           Generate barebones OAS3 file. Accepts the following arguments:
  -t         --tag='Admin Panel,Customer Panel'      Specify your project's tags, which will be referenced in your paths. Comma-separated.
  -n         --name='Application'                    Specify your application's title.
  \n` 
    console.log(message)
    process.exit(0)
}

function createMethodObject(method, responses, tags){
  method = method.toLowerCase()
  let requestBody = ''
  let responseObjects = ''

  function createResponseObject(code){
    return `"${code}": {"description": "${status[code]}"}`
  }

  function addRequestBody(){
    return `
      "requestBody": {
        "description": "",
        "content": {

        }
      },`
  }

  if (method === 'post' || method === 'put') requestBody = addRequestBody()


  for (let i = 0; i < responses.length; i++) {
    responseObjects = responseObjects + createResponseObject(responses[i])
    if (i !== responses.length-1) responseObjects = responseObjects+',\n        '
  }

  let data =  `"${method}": {
      "tags": ["${tags}"],
      "summary": "",${requestBody}
      "responses": {
        ${responseObjects}
      }
    }`
  return data
}

function addPath(path, methods, responses, tags){
  let methodObjects = ''

  for (let i = 0; i < methods.length; i++) {
    methodObjects = methodObjects + createMethodObject(methods[i], responses, tags)
    if (i !== methods.length-1) methodObjects = methodObjects+',\n  '
  }
  
  let data = `"/${path}": {\n ${methodObjects}\n},`

  console.log(data)
}

function generateStub(title, tags){
  try {
    function createTagObject(name){
      return `{"name": "${name}", "description": "Tag description"}`
    }
    
    let data = ''    
    for (let i = 0; i < tags.length; i++) {
      data = data + createTagObject(tags[i])
      if (i !== tags.length-1) data = data+',\n       '
    }

    let stub = `{
    "openapi": "3.0.0",
    "info": {
      "version": "0.1.0",
      "title": "${title || 'Application Title'}",
      "description": "Application Description"
    },
    "servers": [
      {
        "url": "http://localhost",
        "description": "Your local application server"
      }
    ],
    "tags": [\n       ${data}
    ],
    "paths": {
    
    }
  `

    console.log(stub)
    process.exit(0)
  } catch(err) {
    console.log(err)
    process.exit(1)
  }
}

// main
try {
  let tags = ''
  if (ARGS['--tag']) tags = ARGS['--tag'] 
  
  if (ARGS['--help']) sendHelpMessage()

  if (ARGS['--generate-stub']) {
    generateStub(ARGS['--name'], tags)
  }

  if (ARGS['--add-path']) {
    
    if (!ARGS['--paths']) throw `Missing parameter: --paths. Please specify a path with '-p paths' or '--paths=paths'.`
    let paths = ARGS['--paths'].split(',')

    let methods = DEFAULT_METHODS
    if (ARGS['--methods']) methods = ARGS['--methods'].split(',')

    let responses = DEFAULT_RESPONSE_CODES 
    if (ARGS['--responses']) responses = ARGS['--responses'].split(',')

    for (let i = 0; i < paths.length; i++) addPath(paths[i], methods, responses, tags)
  }
} 
catch(err) {
  console.log(err)
  process.exit(1)
}