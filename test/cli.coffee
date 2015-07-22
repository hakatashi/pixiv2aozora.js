fs = require 'fs'
path = require 'path'
exec = require('child_process').exec

chai = require 'chai'
assert = chai.assert
expect = chai.expect
should = chai.should()
pixiv2aozora = require '../'

describe 'pixiv2aozora command', ->
	it 'should basically translate some texts', (done) ->
		if process.platform is 'win32'
			command = '.\\node_modules\\.bin\\coffee cli.coffee'
		else
			command = './node_modules/.bin/coffee cli.coffee'

		cli = exec command, cwd: path.join __dirname, '..'

		# stdin
		cli.stdin.end 'もじれつー'

		# stdout
		stdout = ''
		cli.stdout.on 'data', (chunk) -> stdout += chunk

		# stderr
		cli.stderr.pipe process.stderr

		cli.on 'close', (code) ->
			code.should.equals 0
			stdout.should.equals 'もじれつー'
			done()
