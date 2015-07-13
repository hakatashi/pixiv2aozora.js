#!/usr/bin/env coffee

fs = require 'fs'
util = require 'util'
stream = require 'stream'

program = require 'commander'
pixiv2aozora = require './'

program
.version '0.0.0'
.description 'Convert pixiv-Novel text into Aozora-style text'
.usage '[options] <file>'
.option '-o, --output <file>', 'Write output to <file> instead of stdout', String
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

# Setup pixiv2aozora stream
class P2AStream extends stream.Transform
	_transform: (chunk, encoding, callback) ->
		@push pixiv2aozora chunk.toString()
		callback()

# Instance P2AStream
p2aStream = new P2AStream()

# Be a plumber!
input.pipe(p2aStream).pipe(output)
