module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
          dist: {
            options: {
              style: 'compressed',
              sourcemap: 'none',
              banner: 'This file (style.css) is created automatically'
            },
            files: {
              'css/style.css': 'css/main.scss',
            }
          }
        },

        watch: {
          files: 'css/*.scss',
          tasks: ['sass:dist'],
          options: {
            interrupt: true,
            livereload: false,
          },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['sass:dist']);
}
