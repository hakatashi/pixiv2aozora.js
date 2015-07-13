Parser = require('pixiv-novel-parser').Parser

META =
	SOFTBREAK: 10001

serialize = (AST) ->
	switch AST.type

		# Token array
		when undefined
			aozora = []
			for token in AST
				aozora = aozora.concat serialize token

		# Tag token
		when 'tag'
			aozora = tags[AST.name] AST

		# Text token
		when 'text'
			aozora = [AST.val]

	return aozora

tags =
	newpage: -> [
		META.SOFTBREAK
		'［＃改ページ］'
		META.SOFTBREAK
	]

	chapter: (AST) -> [
		META.SOFTBREAK
		"［＃大見出し］#{toAozora AST.title}［＃大見出し終わり］"
		META.SOFTBREAK
	]

	rb: (AST) -> ["｜#{AST.rubyBase}《#{AST.rubyText}》"]

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
