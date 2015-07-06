# require() pixiv2aozora into global

# Node.js detection
if not typeof module isnt 'undefined'
	global = window

global.pixiv2aozora = require './'
