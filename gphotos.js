const {
  GPhotos
} = require('upload-gphotos');
const fs = require('fs');
var streamifier = require('./lib/streamifier.js');

module.exports = function(RED) {
  function PhotoAccount(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.loginAttempt = false;
    node.gphotos = new GPhotos();
  }

  function UploadPhoto(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const fileName = config.fileName;
    const albumName = config.albumName;
    const photoAccount = RED.nodes.getNode(config.account);

    async function upload(fileName, albumName, payload) {
      if (!photoAccount.gphotos.userId && !photoAccount.loginAttempt) {
        photoAccount.loginAttempt = true;
        node.log('Google login ' + photoAccount.credentials.username);
        await photoAccount.gphotos.signin({
          username: photoAccount.credentials.username,
          password: photoAccount.credentials.password
        });
      }

      let photo;
      if (payload.image === undefined) {
        photo = await photoAccount.gphotos.upload({
          stream: fs.createReadStream(fileName),
          size: (await fs.promises.stat(fileName)).size,
          filename: fileName
        });
      } else {
        photo = await photoAccount.gphotos.upload({
          stream: streamifier.createReadStream(payload.image),
          size: payload.image.length,
          filename: fileName
        });
      }
      node.log('photo id ' + photo.id);
      // const album = await photoAccount.account.searchOrCreateAlbum(albumName);
      const album =
        (await photoAccount.gphotos.searchAlbum({
          title: albumName
        })) || (await photoAccount.gphotos.createAlbum({
          title: albumName
        }));
      node.log('album id ' + album.id);
      await album.append(photo);
      if (payload.description) {
        node.log("description " + payload.description);
        await photo.modifyDescription({
          description: payload.description
        });
      }
      if (payload.timestamp) {
        node.log("timestamp " + payload.timestamp);
        await photo.modifyCreatedDate({
          createdDate: new Date(payload.timestamp)
        });
      }
    }

    node.on('input', function(msg) {
      var upName = undefined;
      var upAlbum = undefined;

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
        }).catch(function(err) {
          photoAccount.loginAttempt = false;
          console.error(err);
          node.status({
            text: 'ERROR: ' + err.message,
            shape: 'dot',
            fill: 'red'
          });
          node.error('ERROR: ' + err.message, msg);
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
