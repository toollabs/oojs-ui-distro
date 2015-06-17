(function() {
	var git         = new( require( 'git-wrapper' ) )();
	var $           = require( './lib/jQuery.js' );
	var fs          = require( 'fs-extra' );
	var exec        = require( 'child_process' ).exec;
	var now         = new Date();

	// Change to oojs-ui dir
	process.chdir( './public_html/oojs-ui' );

	var repoOldRev, repoNewRev, moveAndBuild, addBuild2List;

	addBuild2List = function() {
		// Change to public_html directory
		process.chdir( '..' );
		// Attempt to load JSON data
		var buildList = [];
		try {
			buildList = require( '../public_html/buildlist.json' );
		} catch ( ex ) {
			console.log( ex );
		}
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
		var sevenZip = '7z';
		var filesNFolders2Archive = [
			'demos', 'vendor', 'php', 'i18n', 'LICENSE-MIT', 'README.md', 'AUTHORS.txt'
		];

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
			filesNFolders2Archive.forEach( function( item, index ) {
				fs.renameSync( item, '../dist_old/' + repoOldRev + '/' + item );
			} );
			fs.copySync( 'node_modules/jquery/dist', '../dist_old/' + repoOldRev + '/node_modules/jquery/dist' );
			fs.copySync( 'node_modules/oojs/dist', '../dist_old/' + repoOldRev + '/node_modules/oojs/dist' );

			console.log( 'Creating archive...' );

			exec( sevenZip + ' a "../arch_old/oojs-ui-' + repoOldRev + '.7z" "../dist_old/' + repoOldRev + '/"', function( err, msg ) {
				// console.log( err );
				// console.log( msg );
				git.exec( 'reset', [ '--hard', 'origin/master' ], function( err, msg ) {
					git.exec( 'checkout', {
						f: true
					}, [ 'master' ], function( err, msg ) {
						console.log( 'Building...' );
						exec( 'npm install', function( err, msg ) {
							console.log( 'composer: Updating composer...' );
							exec( '~/composer/composer.phar self-update', function() {
								console.log( 'composer: Pulling-in vendor libs...' );
								exec( '~/composer/composer.phar install', function() {
									console.log( 'composer: Updating vendors...' );
									exec( '~/composer/composer.phar update', function() {
										console.log( 'Creating archive of current version' );
										try {
											fs.unlinkSync( '../oojsui.7z' );
										} catch ( ex ) {}

										filesNFolders2Archive.push('node_modules/jquery/dist');
										filesNFolders2Archive.push('node_modules/oojs/dist');
										var filesNames = '"' + filesNFolders2Archive.join( '" "' ) + '" "dist"';
										var cmd = sevenZip + ' a "../oojsui.7z" ' + filesNames;
										console.log( cmd );
										exec( cmd, function() {
											console.log( 'Listing backup...' );
											addBuild2List();
										} );
									} );
								} );
							} );
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
