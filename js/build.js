// TODO: Write available revisions into JSON file

(function() {

	var git        = new( require( 'git-wrapper' ) )();
	var $          = require( './lib/jQuery.js' );
	var fs         = require( 'fs' );
	var exec       = require( 'child_process' ).exec;
	var dateFormat = require( 'dateformat' );
	var now	       = new Date();


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

	var repoOldRev, repoNewRev, moveAndBuild, addBuild2List;

	addBuild2List = function() {
		// Change to public_html directory
		process.chdir( '..' );
		// Attempt to load JSON data
		var buildList = [];
		try {
			buildList = require( 'buildlist.json' );
		} catch ( ex ) {}
		buildList.push( {
			rev: repoOldRev,
			date: now
		} );
		buildList = JSON.stringify( buildList );
		fs.writeFileSync( 'buildlist.json', buildList, {
			encoding: 'utf8',
			mode: '664'
		} );
		console.log( 'Done! Bye bye!' );
	};

	moveAndBuild = function() {
		try {
			fs.mkdirSync( '../dist_old', '2775' );
			fs.mkdirSync( '../arch_old', '2775' );
		} catch ( ex ) {}

		console.log( 'Backing up old distro...' );
		fs.mkdirSync( '../dist_old/' + repoOldRev, '2775' );
		fs.renameSync( 'dist', '../dist_old/' + repoOldRev + '/dist' );
		fs.mkdirSync( 'dist', '2775' );

		console.log( 'Backing up dependencies...' );
		git.exec( 'checkout', [ repoOldRev ], function( err, msg ) {
			fs.renameSync( 'lib', '../dist_old/' + repoOldRev + '/lib' );
			fs.renameSync( 'demos', '../dist_old/' + repoOldRev + '/demos' );
			fs.renameSync( 'LICENSE-MIT', '../dist_old/' + repoOldRev + '/LICENSE-MIT' );
			fs.renameSync( 'README.md', '../dist_old/' + repoOldRev + '/README.md' );
			fs.renameSync( 'AUTHORS.txt', '../dist_old/' + repoOldRev + '/AUTHORS.txt' );

			console.log( 'Creating archive...' );
			exec( '7z a -r "../arch_old/oojs-ui-' + repoOldRev + '.7z" "../dist_old/' + repoOldRev + '/"', function() {
				git.exec( 'reset', [ '--hard', 'origin/master' ], function( err, msg ) {
					git.exec( 'checkout', {
						f: true
					}, [ 'master' ], function( err, msg ) {
						console.log( 'Building...' );
						exec( 'npm install', function( err, msg ) {
							console.log( 'Listing backup...' );
							addBuild2List();
						} );
					} );
				} );
			} );
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
