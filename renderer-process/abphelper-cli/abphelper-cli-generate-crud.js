const { dialog } = require('electron').remote
const exec = require('child_process').exec
const fs = require('fs')

let isRunning = false

let extraOptions = {
  separateDto: false,
  skipPermissions: false,
  repository: false,
  skipDbMigrations: false,
  skipUi: false,
  skipViewModel: false,
  skipLocalization: false,
  skipTest: false,
  skipEntityCtor: false,
  noOverwirte: false
}

let consoleNode = document.getElementById('box-abphelper-cli-generate-crud').getElementsByTagName('textarea')[0]

const execBtn = document.getElementById('crud-execute')
const selectSolutionFileBtn = document.getElementById('crud-select-solution-file-btn')
const extraOptionsCheckBox = {
  separateDto: document.getElementById('crud-options-separateDto'),
  skipPermissions: document.getElementById('crud-options-skipPermissions'),
  repository: document.getElementById('crud-options-repository'),
  skipDbMigrations: document.getElementById('crud-options-skipDbMigrations'),
  skipUi: document.getElementById('crud-options-skipUi'),
  skipViewModel: document.getElementById('crud-options-skipViewModel'),
  skipLocalization: document.getElementById('crud-options-skipLocalization'),
  skipTest: document.getElementById('crud-options-skipTest'),
  skipEntityCtor: document.getElementById('crud-options-skipEntityCtor'),
  noOverwirte: document.getElementById('crud-options-noOverwirte')
}

selectSolutionFileBtn.addEventListener('click', (event) => {
  dialog.showOpenDialog({
    filters: [
      { name: 'Abp Solution', extensions: ['sln'] },
    ],
    properties: ['openFile']
  }).then(result => {
    if (result.filePaths[0]) {
      document.getElementById('crud-solution-file').value = result.filePaths[0]
    }
  }).catch(err => {
    console.log(err)
  })
})

function findLastStr(str, cha, num) {
  let times = num == 0 ? 1 : num;
  var x = str.lastIndexOf(cha);
  for (var i = 0; i < times - 1; i++) {
      x = str.lastIndexOf(cha, x - 1);
  }
  return x;
}

function getSolutionRootPath(slnFilePath) {
  let separator = slnFilePath.indexOf('/') != -1 ? '/' : '\\'
  let strs = slnFilePath.split(separator)
  if (strs.length > 1 && strs[strs.length - 2] === 'aspnet-core') {
    // is app
    return slnFilePath.substr(0, findLastStr(slnFilePath, separator, 2))
  }
  var moduleRootPath = slnFilePath.substr(0, findLastStr(slnFilePath, separator, 1))
  if (fs.existsSync(moduleRootPath + separator + 'host')) {
    // is module
    return moduleRootPath
  }
  return alert('App solution\'s .sln file should be in the "aspnet-core" folder. Module solution should have "host" folder.')
}

execBtn.addEventListener('click', (event) => {
  runExec()
})

extraOptionsCheckBox.separateDto.addEventListener('click', (event) => {
  extraOptions.separateDto = extraOptionsCheckBox.separateDto.checked
})
extraOptionsCheckBox.skipPermissions.addEventListener('click', (event) => {
  extraOptions.skipPermissions = extraOptionsCheckBox.skipPermissions.checked
})
extraOptionsCheckBox.repository.addEventListener('click', (event) => {
  extraOptions.repository = extraOptionsCheckBox.repository.checked
})
extraOptionsCheckBox.skipDbMigrations.addEventListener('click', (event) => {
  extraOptions.skipDbMigrations = extraOptionsCheckBox.skipDbMigrations.checked
})
extraOptionsCheckBox.skipUi.addEventListener('click', (event) => {
  extraOptions.skipUi = extraOptionsCheckBox.skipUi.checked
})
extraOptionsCheckBox.skipViewModel.addEventListener('click', (event) => {
  extraOptions.skipViewModel = extraOptionsCheckBox.skipViewModel.checked
})
extraOptionsCheckBox.skipLocalization.addEventListener('click', (event) => {
  extraOptions.skipLocalization = extraOptionsCheckBox.skipLocalization.checked
})
extraOptionsCheckBox.skipTest.addEventListener('click', (event) => {
  extraOptions.skipTest = extraOptionsCheckBox.skipTest.checked
})
extraOptionsCheckBox.skipEntityCtor.addEventListener('click', (event) => {
  extraOptions.skipEntityCtor = extraOptionsCheckBox.skipEntityCtor.checked
})
extraOptionsCheckBox.noOverwirte.addEventListener('click', (event) => {
  extraOptions.noOverwirte = extraOptionsCheckBox.noOverwirte.checked
})

function runExec() {
  let entityName = document.getElementById('crud-entity-name').value
  let solutionFile = document.getElementById('crud-solution-file').value
  let migrationProjectName = document.getElementById('crud-options-migrationProjectName').value
  if (isRunning || !entityName || !solutionFile) return
  
  let solutionRootPath = getSolutionRootPath(solutionFile)
  if (!solutionRootPath) return

  isRunning = true
  execBtn.disabled = true
  document.getElementById('crud-process').style.display = 'block'

  let cliCommand = process.platform === 'win32' ? '%USERPROFILE%\\.dotnet\\tools\\abphelper' : '$HOME/.dotnet/tools/abphelper'
  let cmdStr = cliCommand + ' generate crud ' + entityName + ' -d ' + solutionRootPath
  if (extraOptions.separateDto) cmdStr += ' --separate-dto'
  if (extraOptions.skipPermissions) cmdStr += ' --skip-permissions'
  if (extraOptions.repository) cmdStr += ' --custom-repository'
  if (extraOptions.skipDbMigrations) cmdStr += ' --skip-db-migrations'
  if (extraOptions.skipUi) cmdStr += ' --skip-ui'
  if (extraOptions.skipViewModel) cmdStr += ' --skip-view-model'
  if (extraOptions.skipLocalization) cmdStr += ' --skip-localization'
  if (extraOptions.skipTest) cmdStr += ' --skip-test'
  if (extraOptions.skipEntityCtor) cmdStr += ' --skip-entity-constructors'
  if (extraOptions.noOverwirte) cmdStr += ' --no-overwrite'
  if (migrationProjectName) cmdStr += ' --migration-project-name ' + migrationProjectName
  clearConsoleContent()
  addConsoleContent(cmdStr + '\n\nRunning...\n')
  scrollConsoleToBottom()
  console.log(cmdStr)
  if (process.platform === 'win32') cmdStr = '@chcp 65001 >nul & cmd /d/s/c ' + cmdStr
  workerProcess = exec(cmdStr, {cwd: '/'})
  
  workerProcess.stdout.on('data', function (data) {
    addConsoleContent(data)
    scrollConsoleToBottom()
  });
 
  workerProcess.stderr.on('data', function (data) {
    addConsoleContent(data)
    scrollConsoleToBottom()
  });
 
  workerProcess.on('close', function (code) {
    isRunning = false
    execBtn.disabled = false
  })

  function scrollConsoleToBottom() {
    consoleNode.scrollTo(0, consoleNode.scrollHeight)
  }

  function addConsoleContent(text) {
    consoleNode.appendChild(document.createTextNode(text))
  }

  function clearConsoleContent() {
    consoleNode.innerHTML = ''
  }
}