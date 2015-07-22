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
		# Important: Node 0.10 does not accept {encoding: null} to return raw buffer, so
		# we get buffer as hex and re-encode it to get raw buffer.
		cli = exec ['node cli.js'].concat(options.args).join(' '),
			cwd: path.join(__dirname, '..')
			encoding: 'hex'
		, (error, stdout, stderr) ->
			if error
				options.callback.apply this, arguments
			else
				stdout = new Buffer stdout, 'hex'
				stderr = new Buffer stderr, 'hex'
				options.callback error, stdout, stderr

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
					stdout.toString().should.equals to
					stderr.toString().should.equals ''
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
					stdout.toString().should.equals TEST_OUT
					stderr.toString().should.equals ''
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
					stdout.toString().should.equals ''
					stderr.toString().should.equals ''
					fs.readFile 'asset.txt', done
				(text, done) ->
					text.toString().should.equals TEST_OUT
					done()
			], done

		it 'should be safe to write back input to the same file', (done) ->
			async.waterfall [
				(done) -> fs.writeFile 'asset.txt', TEST_IN, done
				(done) -> execute
					args: ['asset.txt', '-o asset.txt']
					callback: done
				(stdout, stderr, done) ->
					stdout.toString().should.equals ''
					stderr.toString().should.equals ''
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
					stdout.toString().should.equals TEST_OUT
					stderr.toString().should.equals ''
					done()

		it 'should accept Shift_JIS as encoding', (done) ->
			execute
				args: ['--input-encoding shift_jis']
				stdin: iconv.encode TEST_IN, 'shift_jis'
				callback: (error, stdout, stderr) ->
					if error then throw error
					stdout.toString().should.equals TEST_OUT
					stderr.toString().should.equals ''
					done()

	describe '--output-encoding option', ->
		it 'should accept UTF-16 as encoding', (done) ->
			execute
				args: ['--output-encoding utf16']
				stdin: TEST_IN
				callback: (error, stdout, stderr) ->
					if error then throw error
					iconv.decode(stdout, 'utf16').should.equals TEST_OUT
					stderr.toString().should.equals ''
					done()

		it 'should accept Shift_JIS as encoding', (done) ->
			execute
				args: ['--output-encoding shift_jis']
				stdin: TEST_IN
				callback: (error, stdout, stderr) ->
					if error then throw error
					iconv.decode(stdout, 'shift_jis').should.equals TEST_OUT
					stderr.toString().should.equals ''
					done()
