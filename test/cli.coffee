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

pkg = require '../package.json'

TEST_IN = """
	[chapter: テスト[[rb: 用 > よう]][[rb:小説>しょうせつ]]]

	「これは非道く情緒的な兵器だ。」
	それは同時に悲しみを破砕する。[newpage]

	[[rb: 檣頭電光 > セントエルモ]]がギイ、と弾けた。
	それが斯かる[[jumpuri: 人生 > http://www.vap.co.jp/jinsei/]]の全ての証左だった。

	[jump:1]
"""
TEST_OUT = """
	［＃大見出し］テスト｜用《よう》｜小説《しょうせつ》［＃大見出し終わり］

	「これは非道く情緒的な兵器だ。」
	それは同時に悲しみを破砕する。
	［＃改ページ］

	｜檣頭電光《セントエルモ》がギイ、と弾けた。
	それが斯かる人生の全ての証左だった。

	1ページヘ
"""

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

	it 'should display correct version number by -V', (done) ->
		async.waterfall [
			(done) -> execute
				args: ['-V']
				callback: done
			(stdout, stderr, done) ->
				stdout.toString().trim().should.equals pkg.version
				stderr.toString().should.equals ''
				done()
		], done

	it 'should basically translate some texts by stdin and stdout', (done) ->
		execute
			stdin: TEST_IN
			callback: (error, stdout, stderr) ->
				if error then throw error
				stdout.toString().should.equals TEST_OUT
				stderr.toString().should.equals ''
				done()

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

		it 'should be able to write input back to the same file', (done) ->
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

		it 'should be safe of huge file I/O', (done) ->
			@timeout 5000

			data = ''
			for i in [0...10000]
				data += '無駄'

			async.waterfall [
				(done) ->
					# Append 6B * 10000 * 100 = 6MB
					async.timesSeries 100, (n, done) ->
						fs.appendFile 'asset.txt', data, done
					, done
				(results, done) -> execute
					args: ['asset.txt', '-o asset.txt']
					callback: done
				(stdout, stderr, done) ->
					stdout.toString().should.equals ''
					stderr.toString().should.equals ''
					fs.readFile 'asset.txt', done
				(text, done) ->
					text.length.should.equals 6 * 10000 * 100
					for i in [0...100]
						text.slice(i * 60000, (i + 1) * 60000).toString().should.equals data
					done()
			], done

	describe 'customization', ->
		it 'should be customizable with --config option', (done) ->
			execute
				args: [
					"""--config '{"entities": "publishing"}' """
				]
				stdin: '｜《》'
				callback: (error, stdout, stderr) ->
					if error then throw error
					stdout.toString().should.equals '｜｜｜《｜》'
					stderr.toString().should.equals ''
					done()

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
