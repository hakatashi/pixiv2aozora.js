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
	it 'should translate plain texts as is', ->
		tests =
			'some plain text': 'some plain text'
			'日本語プレーンテキスト': '日本語プレーンテキスト'

		for own from, to of tests
			expect(pixiv2aozora(from)).to.equal to

	describe '[newpage]', ->

		it 'should convert [newpage] into ［＃改ページ］', ->
			tests =
				'[newpage]': '［＃改ページ］'

				"""
				国境の長いトンネルを抜けると、
				[newpage]
				そこは雪国だった。
				""" : """
				国境の長いトンネルを抜けると、
				［＃改ページ］
				そこは雪国だった。
				"""

				"""
				　そんなことを頭の片隅でぼんやり考えながら俺はたいした感慨もなく高校生になり――[newpage]涼宮ハルヒと出会った。
				""" : """
				　そんなことを頭の片隅でぼんやり考えながら俺はたいした感慨もなく高校生になり――［＃改ページ］涼宮ハルヒと出会った。
				"""

			for own from, to of tests
				expect(pixiv2aozora(from)).to.equal to
