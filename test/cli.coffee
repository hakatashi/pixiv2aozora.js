fs = require 'fs'
path = require 'path'
exec = require('child_process').exec

async = require 'async'

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

	it 'should basically translate some texts by stdin and stdout', (done) ->
		tests =
			'もじれつー': 'もじれつー'
			'ながいもじれつー': 'ながいもじれつー'

			"""
			[chapter:[[rb:和歌>ワカ]]]

			「さばかりの事に死ぬるや」
			「さばかりの事に生くるや」
			止せ止せ問答
			""" : """
			［＃大見出し］｜和歌《ワカ》［＃大見出し終わり］

			「さばかりの事に死ぬるや」
			「さばかりの事に生くるや」
			止せ止せ問答
			"""

		async.forEachOfSeries tests, (to, from, done) ->
			execute
				stdin: from
				onClose: (code, stdout) ->
					code.should.equals 0
					stdout.should.equals to
					done()
		, done
