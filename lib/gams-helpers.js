'use babel'

import GamsHelpersView from './gams-helpers-view'
import { CompositeDisposable } from 'atom'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as glob from 'glob'
import shell from 'shelljs'
import findUp from 'find-up'
import PythonShell from 'python-shell'
shell.config.execPath = shell.which('node')

function createCSON(path, flag) {
	path = path.replace(/\\/g, '\\\\\\\\')
	const string = `'.source.gams':
	  'Check':
	    'prefix': 'c'
	    'description': 'Generic command to output set/parameter/variable to website'
	    'body': """
				execute_unload "${path}GAMS-Helper.gdx", $1;
				abort $1;
			"""`

	fs.writeFile(__dirname + '/../snippets/gams-helpers.cson', string, { flag: flag }, (err) => {
		if (err) throw err
	})
}

// initially create a snippet file with the default setting, will not create file if file already exists bc "wx" flag
createCSON(__dirname + path.sep, 'wx')

function getGamsPath() {
	let gamsExec = shell.which('gams')
	// if not found, check in standard directories
	if(!gamsExec) {
		// in case of windows
		if (os.platform() === 'win32') {
			if (glob.sync('C:/GAMS/*/*/')) {
				gamsExec = glob.sync('C:/GAMS/*/*/').last + 'gams.exe'
				return gamsExec
			}
			else if (glob.sync('N:/soft/GAMS*/')) {
				gamsExec = glob.sync('N:/soft/GAMS*/').last + 'gams.exe'
				return gamsExec
			}
		}
		// and mac
		else if (os.platform() === 'darwin') {
			if (glob.sync('/Applications/GAMS*/sysdir/')) {
				gamsExec = glob.sync('/Applications/GAMS*/sysdir/').last + 'gams'
				return gamsExec
			}
		}
	}
}

function getCommandLine() {
	switch (process.platform) {
	case 'darwin' : return 'open'
	case 'win32' : return 'start'
	case 'win64' : return 'start'
	default : return 'xdg-open'
	}
}


export default {
	config: {
		'Gams Executable': {
			'description': 'Path to GAMS executable, will default to PATH or common install directories.',
			'type': 'string',
			'default': getGamsPath()
		},
		'Scratch directory': {
			'description': 'The (scratch) directory where GAMS will read/write temp files. Ideally located on a fast internal disk.',
			'type': 'string',
			'default': __dirname
		}
	},

	gamsHelpersView: null,
	modalPanel: null,
	subscriptions: null,

	activate(state) {
		this.gamsHelpersView = new GamsHelpersView(state.gamsHelpersViewState)
		this.modalPanel = atom.workspace.addModalPanel({
			item: this.gamsHelpersView.getElement(),
			visible: false
		})

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable()

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'gams-helpers:check': () => this.check(),
			'gams-helpers:run': () => this.run()
		}))

		this.subscriptions.add(atom.config.onDidChange('gams-helpers', ({oldValue, newValue}) => {
			createCSON(newValue + path.sep, 'w')
		}))

	},

	deactivate() {
		this.modalPanel.destroy()
		this.subscriptions.dispose()
		this.gamsHelpersView.destroy()
	},

	serialize() {
		return {
			gamsHelpersViewState: this.gamsHelpersView.serialize()
		}
	},

	run(callback) {
		let editor
		if (editor = atom.workspace.getActiveTextEditor()) {
			let filePath = editor.getPath()
			let directory = editor.getDirectoryPath()
			let gamsExe = atom.config.get('gams-helpers.Gams Executable')
			let scratchdir = atom.config.get('gams-helpers.Scratch directory') + path.sep
			let ggigParams = ''

			findUp('exp_starter.gms', directory).then((expStarter) => {
				if (expStarter) {
					filePath = expStarter
					directory = path.dirname(expStarter) + path.sep
					ggigParams = '--scen=incgen/runInc --baseBreed=falseFleckvieh'
				}

				let listingPath = path.parse(filePath)
				listingPath.ext = '.lst'
				listingPath.base = ''
				listingPath = path.format(listingPath)
				let gamsParams = gamsExe + ' ' + filePath + ' lo=0 -scrdir="' + scratchdir + '" ' + ggigParams

				shell.cd(directory)
				shell.exec(gamsParams, (code, stdout, stderr) => {
					if (stderr) console.log(stderr)
					if(callback) callback()
					else atom.open({'pathsToOpen': [listingPath], 'newWindow': false})
				})
			})
		}
	},

	check() {
		let editor
		if (editor = atom.workspace.getActiveTextEditor()) {
			const gdxFile = atom.config.get('gams-helpers.Scratch directory') + path.sep + 'GAMS-Helper.gdx'
			const htmlFile = atom.config.get('gams-helpers.Scratch directory') + path.sep + 'GAMS-Helper.html'

			this.run(() => {
				PythonShell.run(atom.config.get('gams-helpers.Scratch directory') + path.sep +  'importGDX.py', {args: [gdxFile]}, (err, results) => {
					if (err) throw err
					// results is an array consisting of messages collected during execution
					const csvString = '`' + results.join('') + '`'
					const htmlStart = '<!DOCTYPE html> <html> <head> <title>GAMS-Helper</title> <!-- external libs from cdnjs --> <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script> <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script> <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js"></script> <!-- PivotTable.js libs from ../dist --> <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/pivottable/2.19.0/pivot.min.css"> <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/pivottable/2.19.0/pivot.min.js"></script> <style> body {font-family: Verdana;} </style> </head> <body>'
					const htmlEnd = '    </body> </html>'
					const htmlBody = `        <script type="text/javascript">
									var csvString = ${csvString}
							    $(function(){
							        Papa.parse(csvString, {
							            complete: function(parsed){
							                $("#output").pivotUI(parsed.data, {rows: parsed.data[0].slice(1,parsed.data[0].length - 2),
																																 cols: [parsed.data[0][parsed.data[0].length -2]],
																																 aggregatorName: "Last",
																																 vals: [parsed.data[0][parsed.data[0].length -1]]
																															 });
							            }
							        });
							     });
					        </script>
					        <div id="output" style="margin: 30px;"></div>`

					fs.writeFile(htmlFile, htmlStart + htmlBody + htmlEnd, () => {
						shell.exec(getCommandLine() + ' ' + htmlFile)
					})
				})
			})
		}
	}
}