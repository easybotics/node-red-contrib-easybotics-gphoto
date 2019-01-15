const gphoto = require('upload-gphotos').default;
const fs = require('fs');

module.exports = function (RED)
{
	function PhotoAccount (config)
	{
		RED.nodes.createNode(this, config);
		const node = this;

			
		node.account = new gphoto({ username: node.credentials.username, password: node.credentials.password});
		node.account.login( function() { node.log("logged into: " + node.credentials.username)});
	}

	function UploadPhoto (config)
	{
		RED.nodes.createNode(this, config);
		const node = this; 

		const fileName		= config.fileName;
		const albumName		= config.albumName;
		const photoAccount	= RED.nodes.getNode(config.account);

		async function upload (fileName, albumName)
		{
			const photo = await photoAccount.account.upload(fileName);
			const album = await photoAccount.account.searchOrCreateAlbum(albumName);

			await album.addPhoto(photo);
		}

		node.on('input', function(msg)
		{
			upName  = undefined; 
			upAlbum = undefined;

			if( typeof msg.payload === "string")
			{
				upName = msg.payload;
			}

			if( msg.payload.fileName)
			{
				upName = msg.payload.fileName;
			}

			if( msg.payload.album)
			{
				upAlbum = msg.payload.album;
			}

			if(!upName) upName = fileName;
			if(!upAlbum) upAlbum = albumName;

			node.log(upName);
			node.log(upAlbum);

			if(upName && upAlbum)
			{
				node.log("uploading: " + upName + "to album: " + upAlbum);
				upload(upName, upAlbum);
			}
		});
	}

	RED.nodes.registerType("photo-account", PhotoAccount, {
		credentials: {
			username: {type: "text"}, 
			password: {type: "password"}
			}
		});
	RED.nodes.registerType("upload-photo", UploadPhoto);
}
