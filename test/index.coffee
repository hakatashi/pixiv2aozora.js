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
	args = []

	afterEach ->
		for own from, to of tests
			expect(pixiv2aozora.apply(pixiv2aozora, [from].concat args)).to.equal to
		tests = {}
		args = []

	it 'should translate plain texts as is', ->
		tests =
			'some plain text': 'some plain text'
			'日本語プレーンテキスト': '日本語プレーンテキスト'

	it 'should escape special characters into their entities', ->
		tests =
			"""
			］－［｜／３４＜＃！
			""" : """
			※［＃終わり角括弧、1-1-47］－※［＃始め角括弧、1-1-46］※［＃縦線、1-1-35］／３４＜※［＃井げた、1-1-84］！
			"""

			"""
			※ただしイケメンに限る
			""" : """
			※［＃米印、1-2-8］ただしイケメンに限る
			"""

			"""
			《※》
			｜＃｜
			〔※〕
			""" : """
			※［＃始め二重山括弧、1-1-52］※［＃米印、1-2-8］※［＃終わり二重山括弧、1-1-53］
			※［＃縦線、1-1-35］※［＃井げた、1-1-84］※［＃縦線、1-1-35］
			※［＃始めきっこう（亀甲）括弧、1-1-44］※［＃米印、1-2-8］※［＃終わりきっこう（亀甲）括弧、1-1-45］
			"""

	it 'should escape special characters inside tags', ->
		tests =
			"""
			[[jumpuri: [[rb: ※※※ > ちょめちょめ]] > https://ja.wikipedia.org/wiki/%E4%BC%8F%E5%AD%97]]
			""" : """
			｜※［＃米印、1-2-8］※［＃米印、1-2-8］※［＃米印、1-2-8］《ちょめちょめ》
			"""

			"""
			[chapter:※鳥肌注意※]
			""" : """
			［＃大見出し］※［＃米印、1-2-8］鳥肌注意※［＃米印、1-2-8］［＃大見出し終わり］
			"""

	describe '[newpage]', ->

		it 'should be converted into ［＃改ページ］', ->
			tests =
				"""
				[newpage]
				""" : """
				［＃改ページ］
				"""

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
				[chapter:おわりのはじまり]
				""" : """
				［＃大見出し］おわりのはじまり［＃大見出し終わり］
				"""

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

	describe 'options', ->
		it 'should throw error when suspicious option was supplied', ->
			# Unsafe inputs
			expect(pixiv2aozora.bind pixiv2aozora, 'ピクシブ弐青空', 42).to.throw Error
			expect(pixiv2aozora.bind pixiv2aozora, 'ピクシブ弐青空', '究極の疑問の答え').to.throw Error
			expect(pixiv2aozora.bind pixiv2aozora, 'ピクシブ弐青空', parseInt).to.throw Error
			# Safe inputs
			expect(pixiv2aozora.bind pixiv2aozora, 'ピクシブ弐青空', null).not.to.throw Error
			expect(pixiv2aozora.bind pixiv2aozora, 'ピクシブ弐青空', undefined).not.to.throw Error

		describe 'options.entities', ->
			it 'should be the same result when \'aozora\' was supplied', ->
				args = [
					entities: 'aozora'
				]
				tests =
					'［］': '※［＃始め角括弧、1-1-46］※［＃終わり角括弧、1-1-47］'

			it 'should be customizable with \'publishing\'', ->
				args = [
					entities: 'publishing'
				]
				tests =
					'［＃青空文庫］': '｜［＃青空文庫｜］'
					'※ただしイケメンに限る': '※ただしイケメンに限る'
					'｜pixiv《ピクシブ》': '｜｜pixiv｜《ピクシブ｜》'

					"""
					《※》
					｜＃｜
					〔※〕
					""" : """
					｜《※｜》
					｜｜＃｜｜
					〔※〕
					"""

			it 'should be customizable with custom replacement table', ->
				args = [
					entities:
						'\\': '\\\\'
						'^': '\\^'
						'$': '\\$'
				]
				tests =
					'/^\\t青空$/': '/\\^\\\\t青空\\$/'

		describe 'options.transform', ->
			it 'should be acceptable of custom transformer function', ->
				aozora = pixiv2aozora 'この文章は[[rb:前後反転>ぜんごはんてん]]しています。',
					transform: (AST) ->
						reverse = (string) -> string.split('').reverse().join ''

						transform = (AST) ->
							switch AST.type
								when undefined
									for token, index in AST
										AST[index] = transform token
									AST = AST.reverse()
								when 'tag'
									switch AST.name
										when 'chapter'
											AST.title = transform AST.title
										when 'rb'
											AST.rubyBase = reverse AST.rubyBase
											AST.rubyText = reverse AST.rubyText
										when 'jumpuri'
											AST.title = transform AST.title
								when 'text'
									AST.val = reverse AST.val
							return AST

						return transform AST

				expect(aozora).to.equal '。すまいてし｜転反後前《んてんはごんぜ》は章文のこ'

			it 'should supply usual escaping function as second ardument', ->
				aozora = pixiv2aozora '［＃青空文庫］',
					transform: (AST, escapeAST) -> escapeAST AST
					entities: 'publishing'

				expect(aozora).to.equal '｜［＃青空文庫｜］'
