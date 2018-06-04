'use babel'

const os = require('os')
const glob = require('glob')
const shell = require('shelljs')
import _ from 'lodash'

export default {
  getGamsPath() {
    let gamsExec = shell.which('gams')
    // if not found, check in standard directories
    if(!gamsExec) {
      // in case of windows
      if (os.platform() === 'win32') {
        if (glob.sync('C:\\GAMS\\*\\*\\').length > 0) {
          gamsExec = glob.sync('C:/GAMS/*/*/')[glob.sync('C:/GAMS/*/*/').length - 1] + 'gams.exe'
          return gamsExec
        } 
        else if (glob.sync('N:\\soft\\GAMS*\\').length > 0) {
          gamsExec = glob.sync('N:\\soft\\GAMS*\\')[glob.sync('N:\\soft\\GAMS*\\').length - 1] + 'gams.exe'
          return gamsExec
        } else {
          this.alert('noGAMS')
          return ''
        }
      }
      // and mac
      else if (os.platform() === 'darwin') {
        if (glob.sync('/Applications/GAMS*/sysdir/').length > 0) {
          gamsExec = glob.sync('/Applications/GAMS*/sysdir/')[glob.sync('/Applications/GAMS*/sysdir/').length - 1] + 'gams'
          return gamsExec
        } else {
          this.alert('noGAMS')
          return ''
        }
      } else {
        this.alert('noGAMS')
        return ''
      }
    }
  },

  notify(title, msg) {
    atom.notifications.addInfo(title, { detail: msg, dismissable: true })
  },

  alert(message) {
    let details
    if (message === 'noGAMS') {
      details = {
        title: 'No GAMS installation found.',
        msg: 'Linter-GAMS needs a working GAMS installation to function. Please specify the installation path in the settings',
        buttons: [{
          text: 'Open settings',
          onDidClick() {
            return atom.workspace.open('atom://config/packages/linter-gams')
          }
        }, {
          text: 'Close',
          onDidClick() {
            return
          }
        }]
      }
    } else {
      return
    }

    atom.notifications.addError(details.title, {
      description: details.msg,
      buttons: details.buttons
    })
  }
}