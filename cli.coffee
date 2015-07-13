fs = require 'fs'
util = require 'util'
stream = require 'stream'

program = require 'commander'
iconv = require 'iconv-lite'
pixiv2aozora = require './'

program
.version '0.0.0'
.description 'Convert pixiv-Novel text into Aozora-style text'
.usage '[options] <file>'
.option '-o, --output <file>', 'Write output to <file> instead of stdout', String
.option '--input-encoding <encoding>', 'Specify encoding to read from input. Defaults to utf8', String
.option '--output-encoding <encoding>', 'Specify encoding to write to output. Defaults to utf8', String
.parse process.argv

# Process input
if program.args[0] is undefined
	input = process.stdin
else
	input = fs.createReadStream program.args[0]

# Process output
if program.output is undefined
	output = process.stdout
else
	output = fs.createWriteStream program.output

# Encoding defaults to UTF-8
program.inputEncoding ?= 'utf8'
program.outputEncoding ?= 'utf8'

# Setup pixiv2aozora stream
class P2AStream extends stream.Transform
	_transform: (chunk, encoding, callback) ->
		string = iconv.decode chunk, program.inputEncoding
		aozora = pixiv2aozora string
		@push iconv.encode aozora, program.outputEncoding
		callback()

# Instance P2AStream
p2aStream = new P2AStream()

# Be a plumber!
input.pipe(p2aStream).pipe(output)
