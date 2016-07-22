bundle:
	browserify static/js/uzblmonitor.js  -o static/js/bundle.js -t [ babelify --presets [ react ] ]
