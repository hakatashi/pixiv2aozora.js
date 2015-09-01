Parser = require('pixiv-novel-parser').Parser

# Meta Characters
META =
	# Soft breakline: [newpage] and [chapter] inserts breaklines before and after them,
	# among they are not prefered to exists on first or last line of the text.
	# This is praceholder of such breakline that can be removed by postprocessor.
	SOFTBREAK: 10001

entityPresets =
	aozora:
		'《': '※［＃始め二重山括弧、1-1-52］'
		'》': '※［＃終わり二重山括弧、1-1-53］'
		'［': '※［＃始め角括弧、1-1-46］'
		'］': '※［＃終わり角括弧、1-1-47］'
		'〔': '※［＃始めきっこう（亀甲）括弧、1-1-44］'
		'〕': '※［＃終わりきっこう（亀甲）括弧、1-1-45］'
		'｜': '※［＃縦線、1-1-35］'
		'＃': '※［＃井げた、1-1-84］'
		'※': '※［＃米印、1-2-8］'
	publishing:
		'《': '｜《'
		'》': '｜》'
		'［': '｜［'
		'］': '｜］'
		'〔': '〔'
		'〕': '〕'
		'｜': '｜｜'
		'＃': '＃'
		'※': '※'

entities = null
specialChars = null
specialCharsRegEx = null

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
			aozora = [AST.val]

	return aozora

# Escape special chars in text into their entities
escapeText = (text) ->
	text.replace specialCharsRegEx, (char) -> entities[char]

# Escape all texts inside AST
escapeAST = (AST) ->

	switch AST.type
		when undefined
			for token, index in AST
				AST[index] = escapeAST token
		when 'tag'
			switch AST.name
				when 'chapter'
					AST.title = escapeAST AST.title
				when 'rb'
					AST.rubyBase = escapeText AST.rubyBase
					AST.rubyText = escapeText AST.rubyText
				when 'jumpuri'
					AST.title = escapeAST AST.title
		when 'text'
			AST.val = escapeText AST.val

	return AST

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
		AST.rubyBase
		'《'
		AST.rubyText
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

pixiv2aozora = (text, options = {}) ->
	if typeof options isnt 'object'
		throw new Error 'Invalid options'

	options.entities ?= 'aozora'

	if typeof options.entities is 'string'
		if not entityPresets[options.entities]?
			throw new Error "Unknown entity presets #{options.entities}"
		else
			entities = entityPresets[options.entities]
	else if typeof options.entities is 'object'
		entities = options.entities
	else
		throw new Error 'Invalid option for entity presets'

	specialChars = (char for own char, entity of entities).join ''
	specialCharsRegEx = new RegExp "[#{specialChars.replace /[-\/\\^$*+?.()|[\]{}]/g, '\\$&'}]", 'g'

	# Initialize AST
	parser = new Parser()
	parser.parse text
	AST = parser.tree

	# Custom transformer of AST
	if typeof options.transform is 'function'
		AST = options.transform.call this, AST, escapeAST
	else
		AST = escapeAST AST

	return toAozora AST

module.exports = pixiv2aozora
