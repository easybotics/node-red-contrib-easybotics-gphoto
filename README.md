# node-red-contrib-easybotics-gphoto
Takes a filename, and an album and pushes the file to Google Photo's

node-red wrapper of https://github.com/3846masa/upload-gphotos#readme

![](https://raw.githubusercontent.com/easybotics/node-red-contrib-easybotics-gphoto/master/lens2.png)
![](https://raw.githubusercontent.com/easybotics/node-red-contrib-easybotics-gphoto/master/lens.png)

Because of some peculiarities with dependencies this node has to be installed manually, the procedure follows:
in a terminal enter
```
cd ~/.node-red
sudo npm i node-red-contrib-easybotics-gphoto-upload
sudo npm i axios@^0.16.2
```

# Please create a new dedicated google account just for node-red, instead of pasting your login details into random nodes you downloaded online...
    
Turn on "Allowing less secure apps to access your account": https://support.google.com/accounts/answer/6010255

