// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');
  fileSystem = require('fs-extra');
  
  delete config.chromeExtensionBoilerplate;
  
  config.mode = 'production';
  
  var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  console.log("Package info loaded.");
  
  config.plugins = (config.plugins || []).concat(
    new ZipPlugin({
      filename: `${packageInfo.name}-${packageInfo.version}.zip`,
      path: path.join(__dirname, '../', 'zip'),
    }),
  );
  
  console.log("Webpack configuration:", JSON.stringify(config, null, 2));
  
  webpack(config, function (err, stats) {
      if (err) {
          console.error("Webpack compilation error:", err);
          return;
      }
      console.log("Webpack compilation successful.");
      
      console.log(stats.toString({
          colors: true,
          modules: false,
          children: false,
          chunks: false,
          chunkModules: false
      }));
  });
