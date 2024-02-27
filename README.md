<img src="src/assets/img/icon-48.png" width="64"/>

# Chrome Extension (MV3) for ZKP2P

### ⚠️ Notice
- When running the extension against a local [notary server](https://github.com/tlsnotary/tlsn/releases), please ensure that the server's version is the same as the version of this extension

## Installing and Running

### Procedures:

1. Check if your [Node.js](https://nodejs.org/) version is >= **18**.
2. Clone this repository.
3. Run `yarn` to install the dependencies.
4. Run `yarn start`
5. Load your extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.
6. Happy hacking.

## TODO: Building Websockify Docker Image
```
$ git clone https://github.com/novnc/websockify && cd websockify
$ ./docker/build.sh
$ docker run -it --rm -p 55688:80 novnc/websockify 80 api.twitter.com:443
```

## TODO: Running Websockify Docker Image
```
$ cd zk-p2p-extension
$ docker run -it --rm -p 55688:80 novnc/websockify 80 wise.com:443
```

## Packing

After the development of your extension run the command

```
$ NODE_ENV=production yarn build
```

Now, the content of `build` folder will be the extension ready to be submitted to the Chrome Web Store. Just take a look at the [official guide](https://developer.chrome.com/webstore/publish) to more infos about publishing.

## Resources:

- [Webpack documentation](https://webpack.js.org/concepts/)
- [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted)
