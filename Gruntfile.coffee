module.exports = (grunt) ->
	require('load-grunt-tasks') grunt
	require('time-grunt') grunt

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'

		coffee:
			build:
				expand: true
				cwd: '.'
				src: ['**/*.coffee', '!node_modules/**/*', '!Gruntfile.coffee']
				dest: '.'
				ext: '.js'

		browserify:
			build:
				src: 'global.js'
				dest: 'build/pixiv2aozora.js'

		# Server side mocha test
		mochaTest:
			test:
				options:
					reporter: 'spec'
				src: ['test/**/*.js']

		# Client side mocha test
		mocha:
			test:
				options:
					reporter: 'Spec'
					run: true
				src: ['test/index.html']

	grunt.registerTask 'build', ['coffee', 'browserify']
	grunt.registerTask 'test', ['build', 'mochaTest', 'mocha']
	grunt.registerTask 'default', ['test']
