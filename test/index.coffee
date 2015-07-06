# Node.js detection
if typeof module isnt 'undefined' and module.exports?
	inNode = yes
else
	inNode = no

# require() modules in node
if inNode
	chai = require 'chai'
	assert = chai.assert
	expect = chai.expect
	should = chai.should()
	pixiv2aozora = require '../'
# Bring global object to local in browser
else
	assert = window.chai.assert
	expect = window.chai.expect
	pixiv2aozora = window.pixiv2aozora

describe 'pixiv2aozora', ->
	it 'should translate plain texts', ->
		console.log pixiv2aozora
		expect(pixiv2aozora('some plain text')).to.equal 'some plain text'
		expect(pixiv2aozora('日本語プレーンテキスト')).to.equal '日本語プレーンテキスト'
