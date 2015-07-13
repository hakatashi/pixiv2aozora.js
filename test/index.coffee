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
	tests = {}

	afterEach ->
		for own from, to of tests
			expect(pixiv2aozora(from)).to.equal to

	it 'should translate plain texts as is', ->
		tests =
			'some plain text': 'some plain text'
			'日本語プレーンテキスト': '日本語プレーンテキスト'

	describe '[newpage]', ->

		it 'should be converted into ［＃改ページ］', ->
			tests =
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
				　そんなことを頭の片隅でぼんやり考えながら俺はたいした感慨もなく高校生になり――
				[newpage]
				涼宮ハルヒと出会った。
				""" : """
				　そんなことを頭の片隅でぼんやり考えながら俺はたいした感慨もなく高校生になり――
				［＃改ページ］
				涼宮ハルヒと出会った。
				"""

		it 'should insert newlines before and after them', ->
			tests =
				"""
				[newpage]
				""" : """

				［＃改ページ］

				"""

				"""
				吾輩は猫である。[newpage]名前はまだない。
				""" : """
				吾輩は猫である。
				［＃改ページ］
				名前はまだない。
				"""

	describe '[chapter]', ->
		it 'should be converted into ［＃大見出し］', ->
			tests =
				"""
				[chapter:第壱話]
				使徒、襲来

				[chapter:第弐話]
				見知らぬ、天井
				""" : """

				［＃大見出し］第壱話［＃大見出し終わり］
				使徒、襲来

				［＃大見出し］第弐話［＃大見出し終わり］
				見知らぬ、天井
				"""

		it 'should insert newlines before and after them', ->
			tests =
				"""
				[chapter:おわりのはじまり]
				""" : """

				［＃大見出し］おわりのはじまり［＃大見出し終わり］

				"""

				"""
				[chapter:第拾伍話]嘘と沈黙
				Those women longed for the touch of others' lips, and thus invited their kisses.
				[chapter:第拾六話]死に至る病、そして
				Splitting of the Breast
				""" : """

				［＃大見出し］第拾伍話［＃大見出し終わり］
				嘘と沈黙
				Those women longed for the touch of others' lips, and thus invited their kisses.
				［＃大見出し］第拾六話［＃大見出し終わり］
				死に至る病、そして
				Splitting of the Breast
				"""

		it 'should be able to contain [[rb]]', ->
			tests =
				"""
				[chapter:[[rb:夢>ゆめ]]の[[rb:中>なか]]で[[rb:逢>あ]]った、ような……]
				[chapter:それはとっても[[rb:嬉>うれ]]しいなって]
				[chapter:もう[[rb:何>なに]]も[[rb:怖>こわ]]くない]
				""" : """

				［＃大見出し］｜夢《ゆめ》の｜中《なか》で｜逢《あ》った、ような……［＃大見出し終わり］

				［＃大見出し］それはとっても｜嬉《うれ》しいなって［＃大見出し終わり］

				［＃大見出し］もう｜何《なに》も｜怖《こわ》くない［＃大見出し終わり］

				"""

	describe '[[rb]]', ->
		it 'should be converted into ｜□□《○○》', ->
			tests =
				"""
				[[rb: pixiv > ピクシブ]]
				""" : """
				｜pixiv《ピクシブ》
				"""

				"""
				とある[[rb:科学>かがく]]の[[rb:超電磁砲>レールガン]]
				""" : """
				とある｜科学《かがく》の｜超電磁砲《レールガン》
				"""

	describe '[pixivimage]', ->
		it 'should be removed', ->
			tests =
				"""
				[pixivimage:000001]
				""" : ''

				"""
				挿絵01[pixivimage:999999]
				挿絵[pixivimage:683164]02
				[pixivimage:828828]挿絵03
				""" : """
				挿絵01
				挿絵02
				挿絵03
				"""

	describe '[[jumpuri]]', ->
		it 'should be transcribed into plain text', ->
			tests =
				"""
				[[jumpuri: 世界一の小説投稿サイト > http://www.pixiv.net/novel/]]
				""" : """
				世界一の小説投稿サイト
				"""

				"""
				続きは[[jumpuri:ウェブ>https://travis-ci.org/hakatashi/pixiv2aozora.js]]で！
				""" : """
				続きはウェブで！
				"""

		it 'should be able to contain [[rb]]', ->
			tests =
				"""
				[[jumpuri: アメーバで[[rb:検索>けんさく]][[rb:検索>けんさく]]！ > http://google.com]]
				""" : """
				アメーバで｜検索《けんさく》｜検索《けんさく》！
				"""

				"""
				……[[jumpuri: [[rb:地球>ちきゅう]] > http://spaceinfo.jaxa.jp/ja/earth.html]]か、
				なにもかも[[rb:懐>なつ]]かしい……
				""" : """
				……｜地球《ちきゅう》か、
				なにもかも｜懐《なつ》かしい……
				"""

	describe '[jump]', ->
		it 'should be transcribed into plain text', ->
			tests =
				"""
				[jump:01]
				""" : """
				1ページヘ
				"""

				"""
				赤の扉を選んだら[jump:999]、緑の扉を選んだら[jump:801]
				""" : """
				赤の扉を選んだら999ページヘ、緑の扉を選んだら801ページヘ
				"""
