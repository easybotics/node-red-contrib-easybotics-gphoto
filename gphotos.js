const gphoto = require('upload-gphotos').default;
const fs = require('fs');
var streamifier = require('./lib/streamifier.js');

module.exports = function(RED) {
  function PhotoAccount(config) {
    RED.nodes.createNode(this, config);
    const node = this;


    node.loginAttempt = false;
    node.account = new gphoto({
      username: node.credentials.username,
      password: node.credentials.password
    });
  }

  function UploadPhoto(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const fileName = config.fileName;
    const albumName = config.albumName;
    const photoAccount = RED.nodes.getNode(config.account);

    async function upload(fileName, albumName, image) {
      if (!photoAccount.account.userId && !photoAccount.loginAttempt) {
        photoAccount.loginAttempt = true;
        await photoAccount.account.login();
      }

      if (image !== undefined) {
        const photo = await photoAccount.account.upload(fileName);
      } else {
        const photo = await photoAccount.account.uploadFromStream(streamifier.createReadStream(image), image.length, fileName);
      }
      const album = await photoAccount.account.searchOrCreateAlbum(albumName);

      await album.addPhoto(photo);
    }

    node.on('input', function(msg) {
      upName = undefined;
      upAlbum = undefined;

      if (typeof msg.payload === "string") {
        upName = msg.payload;
      }

      if (msg.payload.fileName) {
        upName = msg.payload.fileName;
      }

      if (msg.payload.album) {
        upAlbum = msg.payload.album;
      }

      if (!upName) upName = fileName;

      if (!upAlbum) upAlbum = albumName;

      node.log(upName);
      node.log(upAlbum);

      if (upName && upAlbum) {
        node.log("uploading: " + upName + "to album: " + upAlbum);
        upload(upName, upAlbum, msg.payload.image).then(function() {
          node.send(msg);
        });
      }
    });
  }

  RED.nodes.registerType("photo-account", PhotoAccount, {
    credentials: {
      username: {
        type: "text"
      },
      password: {
        type: "password"
      }
    }
  });
  RED.nodes.registerType("upload-photo", UploadPhoto);
}
