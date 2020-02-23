'use strict';

const path = require('path')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const paths = require('./paths')
const publicPath = ''

const pluginName = 'ConsoleLogOnBuildWebpackPlugin'

function getHoursMinuteSeconds() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}
class ConsoleLogOnBuildWebpackPlugin {
  apply(compiler) {

    compiler.hooks.compile.tap(pluginName, compilation => {
      console.log(`${getHoursMinuteSeconds()}: Compiling ...`)
    })

    compiler.hooks.done.tap(pluginName, compilation => {
      console.log(`${getHoursMinuteSeconds()}: Compile completed`)
    })
  }
}

module.exports = function (env) {

  return {
    mode: env && env.production ? 'production' : 'development',
    entry: [
      // Finally, this is your app's code:
      paths.appIndexJs,
    ],
    output: {
      // Next line is not used in dev but WebpackDevServer crashes without it:
      path: paths.appBuild,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: true,
      // This does not produce a real file. It's just the virtual path that is
      // served by WebpackDevServer in development. This is the JS bundle
      // containing code from all our entry points, and the Webpack runtime.
      filename: './static/js/bundle.js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: './static/js/[name].chunk.js',
      // This is the URL that app is served from. We use "/" in development.
      publicPath: publicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: info =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    },
    resolve: {
      modules: ['node_modules', paths.appNodeModules],

      extensions: [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.json'
      ],
      plugins: [
      ],
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          test: /\.(ts|tsx)$/,
          loader: require.resolve('tslint-loader'),
          enforce: 'pre',
          include: paths.appSrc,
        },
        {
          test: /\.js$/,
          loader: require.resolve('source-map-loader'),
          enforce: 'pre',
          include: paths.appSrc,
        },
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: 10000,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            {
              test: /\.(ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve('ts-loader'),
            },
            {
              test: /\.scss$/,
              use: [
                require.resolve('style-loader'),
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                  },
                },
                require.resolve('sass-loader')
              ],
            },
            {
              test: /\.css$/,
              use: [
                require.resolve('style-loader'),
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                  },
                }
              ],
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader don't uses a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              exclude: [/\.js$/, /\.html$/, /\.json$/],
              loader: require.resolve('file-loader'),
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },
        // ** STOP ** Are you adding a new loader?
        // Make sure to add the new loader(s) before the "file" loader.
      ],
    },
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.appHtml,
      }),
      // Add module names to factory functions so they appear in browser profiler.
      new webpack.NamedModulesPlugin(),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

      // Custom Logging plugin
      new ConsoleLogOnBuildWebpackPlugin()
    ],
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
      hints: false,
    },
    devServer: {
      contentBase: paths.appPublic,
      compress: true,
      host: 'localhost',
      port: 3000,
      clientLogLevel: 'none',
      hot: false,
      inline: false,
      noInfo: true,
      watchOptions: {
        ignored: /node_modules/,
      },
      stats: "minimal",
      // It is important to tell WebpackDevServer to use the same "root" path
      // as we specified in the config. In development, we always serve from /.
      publicPath: publicPath,
      historyApiFallback: {
        // Paths with dots should still use the history fallback.
        // See https://github.com/facebookincubator/create-react-app/issues/387.
        disableDotRule: true,
      },
    }
  }
}
