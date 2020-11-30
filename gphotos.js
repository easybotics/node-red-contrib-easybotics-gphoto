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

    async function upload(fileName, albumName, payload) {
      if (!photoAccount.account.userId && !photoAccount.loginAttempt) {
        photoAccount.loginAttempt = true;
        await photoAccount.account.login();
      }

      let photo;
      if (payload.image === undefined) {
        photo = await photoAccount.account.upload(fileName);
      } else {
        photo = await photoAccount.account.uploadFromStream(streamifier.createReadStream(payload.image), payload.image.length, fileName);
      }
      const album = await photoAccount.account.searchOrCreateAlbum(albumName);

      const id = await album.addPhoto(photo);
      if (payload.description) {
        await photo.modifyDescription(payload.description);
      }
      if (payload.timestamp) {
        await photo.modifyCreatedDate(payload.timestamp);
      }
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

      if (msg.payload.albumName) {
        upAlbum = msg.payload.albumName;
      }

      if (!upName) upName = fileName;

      if (!upAlbum) upAlbum = albumName;

      // node.log("fileName", upName);
      // node.log("album", upAlbum);

      if (upName && upAlbum) {
        node.status({
          text: 'uploading: ' + upName,
          shape: 'dot',
          fill: 'green'
        });
        node.log("uploading: " + upName + "to album: " + upAlbum);
        upload(upName, upAlbum, msg.payload).then(function() {
          node.send(msg);
          node.status({
            text: 'uploaded: ' + upName,
            shape: 'ring',
            fill: 'green'
          });
        });
      } else {
        node.warn('Not uploading, missing filename or album name.');
        node.status({
          text: 'Not uploading, missing filename or album name.',
          shape: 'dot',
          fill: 'yellow'
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
