fs = require 'fs'
path = require 'path'
exec = require('child_process').exec

async = require 'async'

chai = require 'chai'
assert = chai.assert
expect = chai.expect
should = chai.should()
pixiv2aozora = require '../'

TEST_IN = '[[rb:小説>しょうせつ]]'
TEST_OUT = '｜小説《しょうせつ》'

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

	describe 'file I/O', ->
		afterEach (done) -> fs.unlink 'asset.txt', done

		it 'should accept text file as input', (done) ->
			async.series [
				(done) -> fs.writeFile 'asset.txt', TEST_IN, done
				(done) ->
					execute
						args: ['asset.txt']
						onClose: (code, stdout) ->
							code.should.equals 0
							stdout.should.equals TEST_OUT
							done()
			], done

		it 'should accept text file as output', (done) ->
			async.waterfall [
				(done) ->
					execute
						args: ['-o asset.txt']
						stdin: TEST_IN
						onClose: (code, stdout) ->
							code.should.equals 0
							stdout.should.equals ''
							done()
				(done) -> fs.readFile 'asset.txt', done
				(text, done) ->
					text.toString().should.equals TEST_OUT
					done()
			], done
