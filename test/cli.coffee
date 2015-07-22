fs = require 'fs'
path = require 'path'
exec = require('child_process').exec

chai = require 'chai'
assert = chai.assert
expect = chai.expect
should = chai.should()
pixiv2aozora = require '../'

describe 'pixiv2aozora command', ->
	execute = (options = {}) ->
		options.args ?= []
		options.stdin ?= ''
		options.onClose ?= null

		# Execute node
		cli = exec ['node cli.js'].concat(options.args).join ' ', cwd: path.join __dirname, '..'

		# stdin
		cli.stdin.end options.stdin

		# stdout
		stdout = ''
		cli.stdout.on 'data', (chunk) -> stdout += chunk

		# stderr
		cli.stderr.pipe process.stderr

		cli.on 'close', (code) -> options.onClose?(code, stdout)

	it 'should basically translate some texts', (done) ->
		execute
			stdin: 'もじれつー'
			onClose: (code, stdout) ->
				code.should.equals 0
				stdout.should.equals 'もじれつー'
				done()
