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
        msg: 'GAMS-Helpers needs a working GAMS installation to function. Please specify the installation path in the settings',
        buttons: [{
          text: 'Open settings',
          onDidClick() {
            return atom.workspace.open('atom://config/packages/gams-helpers')
          }
        }, {
          text: 'Close',
          onDidClick() {
            return alertNot.dismiss()
          }
        }]
      }
    } else {
      return
    }

    const alertNot = atom.notifications.addError(details.title, {
      description: details.msg,
      buttons: details.buttons
    })
  },

  execLine(filePath,directory,extraParams) {
    return new Promise((resolve, reject) => {
      let gamsExe = atom.config.get('gams-helpers.Gams Executable')
      let scratchdir = atom.config.get('gams-helpers.Scratch directory') //+ path.sep
      // check if exp_starter.gms exists (or other GGIG project entry file), else just check input file
      let parameters = []

      let entryFiles = ['.gamslintc.js']
      if (atom.config.get('linter-gams.Multi-file entry point')) {
        entryFiles = entryFiles.concat(atom.config.get('linter-gams.Multi-file entry point'))
      }

      if (!gamsExe || gamsExe === 'Undefined') {
        this.alert('noGAMS')
        return reject('No GAMS installation found for gams-helpers to run.')
      }
      findUp(entryFiles, {cwd: directory}).then((entryFile) => {
        if (entryFile && path.parse(entryFile).base !== '.gamslintc.js') {
          filePath = entryFile
          directory = path.dirname(entryFile) + path.sep
          const gamsFile = path.parse(entryFile).base

          if (gamsFile === 'exp_starter.gms') {
            parameters = [`--scen=incgen${path.sep}runInc`, '--ggig=on', '--baseBreed=falsemyBasBreed']
          } else if (gamsFile === 'capmod.gms') {
            parameters = [`-scrdir="${scratchdir}"`,'--scen=fortran']
          } else if (gamsFile === 'com_.gms') {
            parameters = [`-procdirpath="${scratchdir}"`, '--scen=com_inc']
          }

          // add compile time parameters from settings view
          parameters = parameters.concat(atom.config.get('linter-gams.Command Line Arguments - Execution'))

        } else if (entryFile && path.parse(entryFile).base === '.gamslintc.js') {
          const configFile = require(entryFile)
          directory = path.dirname(entryFile)
          filePath = configFile['Multi-file entry point'] ? path.resolve(directory,configFile['Multi-file entry point']) : filePath
          parameters = configFile['Command Line Arguments - Execution'] ? configFile['Command Line Arguments - Execution'].join(' ') : parameters
        }


        let listingPath = path.parse(filePath)
        listingPath.ext = '.lst'
        listingPath.base = ''
        listingPath = path.format(listingPath)

        let gamsParams = [filePath, 'PS=0', `-scrdir=${scratchdir}`,
          `--scrdir=${scratchdir}`, `-workdir=${directory}`,
          `-curDir=${directory}`]
        
        if (parameters.length > 0)  gamsParams = gamsParams.concat(parameters)
        if (extraParams.length > 0) gamsParams = gamsParams.concat(extraParams)
        
        resolve({
          gamsExe: gamsExe,
          gamsParams: gamsParams,
          listingPath: listingPath,
          gamsFile: path.parse(filePath).base,
          directory: directory
        })
      })
    })
  }
}
