'use babel'

import { CompositeDisposable } from 'atom'
import * as path from 'path'
import * as utils from './utils'
import shell from 'shelljs'
shell.config.execPath = shell.which('node')

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
      'gams-helpers:run': () => this.run()
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
    const editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      const filePath = editor.getPath()
      const directory = editor.getDirectoryPath()

      // Show blinking busy signal in status bar and toggle the console
      this.provider.add('Running GAMS')
      this.consolePanel.clear()
      this.consolePanel.stickBottom()

      // create GAMS cmd parameter, run the model, and print the stdout to the console during execution
      utils.execLine(filePath,directory, ' lo=3')
        .then((res) => {
          this.consolePanel.log(res.gamsParams)
          // cd to the directory of the GAMS model
          shell.cd(res.directory)
          var child = shell.exec(res.gamsParams,{async:true})
          child.stdout.on('data', data => {
            this.consolePanel.log(data)
          })

          child.stdout.on('end', () => {
            this.provider.clear()
            atom.workspace.open(res.listingPath).then(() => {
              this.consolePanel.toggle()
            })
          })
        })


    }
  }

}
