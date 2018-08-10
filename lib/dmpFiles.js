'use babel'

const { execLine } = require('./utils.js')
const readline = require('readline')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const shell = require('shelljs')

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
			const rl = readline.createInterface({
				input: fs.createReadStream(model.dmpPath),
				crlfDelay: Infinity
			})

			let lineno = 0

			rl.on('line', line => {
				lineno++

				if (/display.*?;/.test(line)) {
					return
				} else if (/solve.*?using/.test(line)) {
					const modelName = line.split(' ')[1]
					if (model.gamsFile === 'exp_starter.gms'
								&& modelName === 'm_farm' && !model.solveLine) {
						model.solveLine = lineno
					}
				}
				model.gams += line
			})

			rl.on('close', () => {
				resolve(model)
			})

		})
	}

}
