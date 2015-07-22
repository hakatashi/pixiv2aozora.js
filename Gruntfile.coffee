module.exports = (grunt) ->
	require('load-grunt-tasks') grunt
	require('time-grunt') grunt

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'

		coffee:
			build:
				expand: true
				cwd: '.'
				src: ['{,*/}*.coffee', '!Gruntfile.coffee']
				dest: '.'
				ext: '.js'

		concat:
			shebang:
				options:
					banner: '#!/usr/bin/env node\n\n'
				src: 'cli.js'
				dest: 'cli.js'

		browserify:
			build:
				src: 'global.js'
				dest: 'build/pixiv2aozora.js'

		# Lint Cafe
		coffeelint:
			options:
				no_tabs:
					level: 'ignore'
				indentation:
					level: 'ignore'
				max_line_length:
					value: 120
			test: ['{,*/}*.coffee']

		# Server side mocha test
		mochaTest:
			test:
				options:
					reporter: 'spec'
				src: ['test/index.js']
			cli:
				options:
					reporter: 'spec'
				src: ['test/cli.js']

		# Client side mocha test
		mocha:
			test:
				options:
					reporter: 'Spec'
					run: true
				src: ['test/index.html']

		copy:
			dist:
				expand: true
				cwd: 'build/'
				src: '*'
				dest: 'dist/'
				filter: 'isFile'

		uglify:
			dist:
				options:
					sourceMap: true
				src: 'dist/pixiv2aozora.js'
				dest: 'dist/pixiv2aozora.min.js'

	# hack to make grunt-contrib-concat NOT insert CRLF on Windows:
	# https://github.com/gruntjs/grunt-contrib-concat/issues/105
	grunt.util.linefeed = '\n'

	grunt.registerTask 'build', ['coffee', 'concat:shebang', 'browserify']
	grunt.registerTask 'test', ['coffeelint', 'mochaTest', 'mocha']
	grunt.registerTask 'dist', ['build', 'test', 'copy', 'uglify']

	grunt.registerTask 'default', ['build', 'test']
