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

		mochaTest:
			test:
				options:
					reporter: 'spec'
				src: ['test/**/*.js']

	grunt.registerTask 'build', ['coffee']
	grunt.registerTask 'test', ['build', 'mochaTest']
	grunt.registerTask 'default', ['test']
