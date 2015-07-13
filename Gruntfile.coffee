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
				src: ['test/{,*/}*.js']

		# Client side mocha test
		mocha:
			test:
				options:
					reporter: 'Spec'
					run: true
				src: ['test/index.html']

	grunt.registerTask 'build', ['coffee', 'concat:shebang', 'browserify']
	grunt.registerTask 'test', ['coffeelint', 'mochaTest', 'mocha']
	grunt.registerTask 'default', ['build', 'test']
