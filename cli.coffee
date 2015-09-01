fs = require 'fs'
util = require 'util'
stream = require 'stream'

program = require 'commander'
iconv = require 'iconv-lite'
pixiv2aozora = require './'

program
.version '0.5.0'
.description 'Convert pixiv-Novel text into Aozora-style text'
.usage '[options] <file>'
.option '-o, --output <file>', 'Write output to <file> instead of stdout', String
.option '-c, --config <json>', 'Optional config object with JSON format', String
.option '--input-encoding <encoding>', 'Specify encoding to read from input. Defaults to utf8', String
.option '--output-encoding <encoding>', 'Specify encoding to write to output. Defaults to utf8', String
.parse process.argv

# Process input
if program.args?[0] is undefined
	input = process.stdin
else
	input = fs.createReadStream program.args[0]

if program.config?
	program.config = JSON.parse program.config

# Encoding defaults to UTF-8
program.inputEncoding ?= 'utf8'
program.outputEncoding ?= 'utf8'

# Store data to buffer
bufferIn = new Buffer(0)

input.on 'data', (chunk) ->
	bufferIn = Buffer.concat [bufferIn, chunk]
input.on 'end', ->
	pixiv = iconv.decode bufferIn, program.inputEncoding
	if program.config?
		aozora = pixiv2aozora pixiv, program.config
	else
		aozora = pixiv2aozora pixiv
	bufferOut = iconv.encode aozora, program.outputEncoding

	# Process output
	if program.output is undefined
		output = process.stdout
	else
		output = fs.createWriteStream program.output

	output.write bufferOut

	# Write out
	if output isnt process.stdout
		output.end()
