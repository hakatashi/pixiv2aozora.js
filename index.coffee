Parser = require('pixiv-novel-parser').Parser

toAozora = (AST) ->
	switch AST.type

		# Token array
		when undefined
			aozora = ''
			for token in AST
				aozora += toAozora token

		# Tag token
		when 'tag'
			aozora = tags[AST.name] AST

		# Text token
		when 'text'
			aozora = AST.val

	return aozora

tags =
	newpage: -> '\n［＃改ページ］\n'

	chapter: (AST) -> "\n［＃大見出し］#{toAozora AST.title}［＃大見出し終わり］\n"

pixiv2aozora = (text) ->
	# Initialize AST
	parser = new Parser()
	parser.parse text
	AST = parser.tree

	return toAozora AST

module.exports = pixiv2aozora
