'use babel'

const { execLine } = require('./utils.js')
import shell from 'shelljs'

/*
0. gams helpers spawns server as external process
1. receive call from linter with gams file / project on save
2. on file changes or init, run the following
 2.1. create .dmp and .ref file
 2.2. parse .dmp and .ref file, delete 'display ...' and detect 'solve.*?using' lines in .dmp
 2.3. inject 'abort ...' with all sets and parameters from parsed ref
 2.4. parse listing and store sets and params in database
3. when a symbol is clicked upon, server answers with details
*/
export default {
	createDMP(file,dir) {
		return new Promise((resolve) => {
			execLine(file,dir,' lo=0 a=c dumpopt=11')
				.then(res => {
					shell.cd(res.directory)
					shell.exec(res.gamsParams,() => {
						resolve(model)
					})
				})
		})
	},
	parseDMP(model) {
		return new Promise(resolve => {
			
		})
	}

}
