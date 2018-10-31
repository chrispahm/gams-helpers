'use babel'

import { CompositeDisposable } from 'atom'
import * as path from 'path'
import * as utils from './utils'
import { spawn } from 'child_process'

export default {

  config: {
    'Gams Executable': {
      'description': 'Path to GAMS executable, will default to PATH or common install directories.',
      'type': 'string',
      'default': utils.getGamsPath()
    },
    'Scratch directory': {
      'description': 'The (scratch) directory where GAMS will read/write temp files. Ideally located on a fast internal disk.',
      'type': 'string',
      'default': path.resolve(__dirname + '/../scrdir')
    }
  },

  gamsHelpersView: null,
  modalPanel: null,
  subscriptions: null,
  consolePanel: null,

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'gams-helpers:run': () => this.run(),
      'gams-helpers:stop': () => this.stop()
    }))

    require('atom-package-deps').install('gams-helpers')
  },

  consumeSignal(registry) {
    this.provider = registry.create()
    this.subscriptions.add(this.provider)
  },

  consumeConsolePanel(consolePanel) {
    this.consolePanel = consolePanel
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  run() {
    return new Promise((resolve, reject) => {
      if (global.gamsUpdating) global.gamsRunning.a = true   
      const editor = atom.workspace.getActiveTextEditor()
      if (!editor) return reject('No editor')
      const filePath = editor.getPath()
      const directory = editor.getDirectoryPath()
  
      // Show blinking busy signal in status bar and toggle the console
      this.provider.add('Running GAMS')
      this.consolePanel.clear()
      this.consolePanel.stickBottom()
  
      // create GAMS cmd parameter, run the model, and print the stdout to the console during execution
      utils.execLine(filePath,directory, ['lo=3'])
        .then((res) => {
          this.consolePanel.log(res.gamsParams.join(' '))
          // cd to the directory of the GAMS model
          this.process = spawn(res.gamsExe, res.gamsParams,{cwd: res.directory, windowsHide: true})
          this.process.stdout.on('data', data => {
            this.consolePanel.log(data.toString())
          })

          this.process.stderr.on('data', data => {
            this.consolePanel.log(data.toString())
          })

          this.process.on('close', (code, signal) => {
            if (signal === 'SIGINT') {
              this.consolePanel.toggle()
              return resolve() 
            }
            this.provider.clear()
            if (global.gamsUpdating) global.gamsRunning.a = false   
            resolve()
            atom.workspace.open(res.listingPath).then(() => {
              this.consolePanel.toggle()
            })
          })
        })
        .catch(err => {
          if (global.gamsUpdating) global.gamsRunning.a = false   
          reject(err)
        })
    })
  },
  stop() {
    if (this.process) {
      this.process.kill('SIGINT')
      this.process.on('exit', () => {
        if (this.provider) this.provider.clear()
        this.process.stdout.end()
        this.process.stderr.end() 
        if (global.gamsUpdating) global.gamsRunning.a = false    
      })
    }
  }

}
