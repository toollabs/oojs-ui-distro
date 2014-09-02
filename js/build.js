// TODO: Write available revisions into JSON file

(function() {

	var git  = new (require('git-wrapper'))();
	var $    = require('./lib/jQuery.js');
	var fs   = require('fs');
	var exec = require('child_process').exec;


	deleteFilesRecursive = function( path ) {
		var filesList = [];
		if ( fs.existsSync( path ) ) {
			filesList = fs.readdirSync( path );
			filesList.forEach( function( item, idx ) {
				var currentPath = path + '/' + item;
				if ( fs.lstatSync( currentPath )
					.isDirectory() ) {
					// recursive call on detected directory
					deleteFilesRecursive( currentPath );
				} else {
					// Bye, file
					fs.unlinkSync( currentPath );
				}
			} );
			fs.rmdirSync( path );
		}
	};


	// Change to oojs-ui dir
	process.chdir( './public_html/oojs-ui' );

	var repoOldRev, repoNewRev, moveAndBuild;

	moveAndBuild = function() {
		fs.renameSync( 'dist', 'dist_' + repoOldRev );
		fs.mkdirSync( 'dist', 2775 );
		exec( 'npm install', function() {
			console.log( 'Done! Bye bye!' );
		} );
	};

	git.exec( 'rev-parse', [ 'HEAD' ], function( err, msg ) {
		repoOldRev = $.trim( msg );

		git.exec( 'pull', [ 'origin master' ], function( err, msg ) {
			git.exec( 'rev-parse', [ 'HEAD' ], function( err, msg ) {
				repoNewRev = $.trim( msg );
				if ( repoOldRev !== repoNewRev ) {
					console.log( 'Move and build' );
					moveAndBuild();
				} else {
					console.log( 'No updates. Aborting.' );
				};
			} );
		} );
	} );
}() );
