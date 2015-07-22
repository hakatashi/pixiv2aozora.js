fs = require 'fs'
path = require 'path'
exec = require('child_process').exec

async = require 'async'
iconv = require 'iconv-lite'

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
		options.callback ?= undefined

		# Execute node
		cli = exec ['node cli.js'].concat(options.args).join(' '), cwd: path.join(__dirname, '..'), options.callback

		# stdin
		cli.stdin.end options.stdin

		# stdout
		stdout = ''
		cli.stdout.on 'data', (chunk) -> stdout += chunk

		# stderr
		cli.stderr.pipe process.stderr

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
				callback: (error, stdout, stderr) ->
					if error then throw error
					stdout.should.equals to
					stderr.should.equals ''
					done()
		, done

	describe 'file I/O', ->
		afterEach (done) -> fs.unlink 'asset.txt', done

		it 'should accept text file as input', (done) ->
			async.waterfall [
				(done) -> fs.writeFile 'asset.txt', TEST_IN, done
				(done) ->
					execute
						args: ['asset.txt']
						callback: done
				(stdout, stderr, done) ->
					stdout.should.equals TEST_OUT
					stderr.should.equals ''
					done()
			], done

		it 'should accept text file as output', (done) ->
			async.waterfall [
				(done) ->
					execute
						args: ['-o asset.txt']
						stdin: TEST_IN
						callback: done
				(stdout, stderr, done) ->
					stdout.should.equals ''
					stderr.should.equals ''
					fs.readFile 'asset.txt', done
				(text, done) ->
					text.toString().should.equals TEST_OUT
					done()
			], done

	describe '--input-encoding option', ->
		it 'should accept UTF-16 as encoding', (done) ->
			execute
				args: ['--input-encoding utf16']
				stdin: iconv.encode TEST_IN, 'utf16'
				callback: (error, stdout, stderr) ->
					if error then throw error
					stdout.should.equals TEST_OUT
					stderr.should.equals ''
					done()

		it 'should accept Shift_JIS as encoding', (done) ->
			execute
				args: ['--input-encoding shift_jis']
				stdin: iconv.encode TEST_IN, 'shift_jis'
				callback: (error, stdout, stderr) ->
					if error then throw error
					stdout.should.equals TEST_OUT
					stderr.should.equals ''
					done()