'use babel'

const os = require('os')
const glob = require('glob')
const shell = require('shelljs')
const path = require('path')
const findUp = require('find-up')

export default {
  getGamsPath() {
    let gamsExec = shell.which('gams')
    if(gamsExec) {
      if (os.platform() === 'win32') {
        gamsExec = gamsExec.replace(/\\/g, '/')
      }
      return gamsExec
    }
    // if not found, check in standard directories
    else {
      // in case of windows
      if (os.platform() === 'win32') {
        if (glob.sync('C:/GAMS/*/*/').length > 0) {
          gamsExec = glob.sync('C:/GAMS/*/*/')[glob.sync('C:/GAMS/*/*/').length - 1] + 'gams.exe'
          return gamsExec
        }
        else if (glob.sync('N:/soft/GAMS*/').length > 0) {
          gamsExec = glob.sync('N:/soft/GAMS*/')[glob.sync('N:/soft/GAMS*/').length - 1] + 'gams.exe'
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
  },

  execLine(filePath,directory,extraParams) {
    return new Promise((resolve) => {
      let gamsExe = atom.config.get('gams-helpers.Gams Executable')
      let scratchdir = atom.config.get('gams-helpers.Scratch directory') //+ path.sep
      let ggigParams = ''

      if (!gamsExe || gamsExe === 'Undefined') return

      findUp(['exp_starter.gms', 'capmod.gms'], directory).then((expStarter) => {
        if (expStarter) {
          filePath = expStarter
          directory = path.dirname(expStarter)// + path.sep
          const gamsFile = path.parse(expStarter).base

          if (gamsFile === 'exp_starter.gms') {
            ggigParams = `--scen=incgen${path.sep}runInc --ggig=on --baseBreed="falsemyBasBreed"`
          } else if (gamsFile === 'capmod.gms') {
            ggigParams = '--scen=fortran'
          } else if (gamsFile === 'com_.gms') {
            ggigParams = '--scen=com_inc'
          }
        }

        let listingPath = path.parse(filePath)
        listingPath.ext = '.lst'
        listingPath.base = ''
        listingPath = path.format(listingPath)

        const gamsParams = gamsExe + ' "' + filePath + '" PS=0  -scrdir="' + scratchdir + '" ' + ' --scrdir="' + scratchdir + '" ' + ' -workdir="' + directory + '" ' + ' -curDir="' + directory + '" ' + ggigParams + extraParams
        resolve({
          gamsParams: gamsParams,
          listingPath: listingPath,
          gamsFile: path.parse(filePath).base,
          directory: directory
        })
      })
    })
  }
}
