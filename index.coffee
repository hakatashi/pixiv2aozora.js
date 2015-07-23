Parser = require('pixiv-novel-parser').Parser

# Meta Characters
META =
	# Soft breakline: [newpage] and [chapter] inserts breaklines before and after them,
	# among they are not prefered to exists on first or last line of the text.
	# This is praceholder of such breakline that can be removed by postprocessor.
	SOFTBREAK: 10001

entities =
	'《': '※［＃始め二重山括弧、1-1-52］'
	'》': '※［＃終わり二重山括弧、1-1-53］'
	'［': '※［＃始め角括弧、1-1-46］'
	'］': '※［＃終わり角括弧、1-1-47］'
	'〔': '※［＃始めきっこう（亀甲）括弧、1-1-44］'
	'〕': '※［＃終わりきっこう（亀甲）括弧、1-1-45］'
	'｜': '※［＃縦線、1-1-35］'
	'＃': '※［＃井げた、1-1-84］'
	'※': '※［＃米印、1-2-8］'

specialChars = (char for own char, entity of entities).join ''
specialCharsRegEx = new RegExp "[#{specialChars}]", 'g'

serialize = (AST) ->
	switch AST.type

		# Token array
		when undefined
			aozora = []
			for token in AST
				aozora.push serialize(token)...

		# Tag token
		when 'tag'
			aozora = tags[AST.name] AST

		# Text token
		when 'text'
			aozora = [escapeText AST.val]

	return aozora

# Escape special chars in text into their entities
escapeText = (text) -> text.replace specialCharsRegEx, (char) -> entities[char]

tags =
	newpage: -> [
		META.SOFTBREAK
		'［＃改ページ］'
		META.SOFTBREAK
	]

	chapter: (AST) -> [
		META.SOFTBREAK
		'［＃大見出し］'
		serialize(AST.title)...
		'［＃大見出し終わり］'
		META.SOFTBREAK
	]

	rb: (AST) -> [
		'｜'
		escapeText AST.rubyBase
		'《'
		escapeText AST.rubyText
		'》'
	]

	pixivimage: -> []

	jumpuri: (AST) -> serialize AST.title

	jump: (AST) -> ["#{AST.pageNumber}ページヘ"]

toAozora = (AST) ->
	tokens = serialize AST

	# Remove soft breakline of first line and last line
	tokens.shift() if tokens[0] is META.SOFTBREAK
	tokens.pop() if tokens[tokens.length - 1] is META.SOFTBREAK

	# Convert to soft breakline to breakline
	for token, i in tokens
		if token is META.SOFTBREAK
			tokens[i] = '\n'

	return tokens.join ''

pixiv2aozora = (text, options) ->
	# Initialize AST
	parser = new Parser()
	parser.parse text
	AST = parser.tree

	return toAozora AST

module.exports = pixiv2aozora
