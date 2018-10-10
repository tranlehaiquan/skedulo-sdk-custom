'use strict';

const path = require('path')
const webpack = require('webpack')
const httpProxy = require('http-proxy')
const TerserPlugin = require('terser-webpack-plugin')

const paths = require('./paths')
const publicPath = ''

const pluginName = 'ConsoleLogOnBuildWebpackPlugin'

const port = 9050
const webpackPort = 43213

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

let authenticatedProxy = null
const cleanupProxy = () => {
  if (authenticatedProxy) {
    authenticatedProxy.close()
  }
}

// Clean up process to handle unexpected process kill
process.on('exit', cleanupProxy)
process.on('SIGINT', cleanupProxy)
process.on('SIGTERM', cleanupProxy)
process.on('SIGUSR1', cleanupProxy)
process.on('SIGUSR2', cleanupProxy)
process.on('uncaughtException', cleanupProxy)

module.exports = function (env) {
  if (!env) {
    const { accessToken, baseUrl } = getRequiredEnvironmentVars()

    authenticatedProxy = new httpProxy.createProxyServer({
      changeOrigin: true,
      target: baseUrl,
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })

    authenticatedProxy.listen(webpackPort, 'localhost')
  }

  return {
    mode: env && env.production ? 'production' : 'development',
    entry: {
      // Finally, this is your app's code:
      main: paths.appBrowserEntryJs,
      native: paths.appNativeEntryJs,
      node: paths.appNodeEntryJs
    },
    output: {
      // Next line is not used in dev but WebpackDevServer crashes without it:
      path: paths.appBuild,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: true,
      // This does not produce a real file. It's just the virtual path that is
      // served by WebpackDevServer in development. This is the JS bundle
      // containing code from all our entry points, and the Webpack runtime.
      filename: './[name].js',
      sourceMapFilename: './[name].js.map',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: './[name].chunk.js',
      // This is the URL that app is served from. We use "/" in development.
      publicPath: publicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: info =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    },
    devtool: env && env.production ? 'source-map' : false,
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
            {
              test: /(\.woff|\.eot|\.svg|\.ttf)($|\?)/,
              loader: require.resolve('url-loader')
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
                name: 'static/[name].[hash:8].[ext]',
              },
            },
          ],
        },
        // ** STOP ** Are you adding a new loader?
        // Make sure to add the new loader(s) before the "file" loader.
      ],
    },
    plugins: [
      // Add module names to factory functions so they appear in browser profiler.
      new webpack.NamedModulesPlugin(),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

      // Custom Logging plugin
      new ConsoleLogOnBuildWebpackPlugin(),

      ...(!env) ? [
        // Dev only plugins (mostly setting global variables)
        new webpack.DefinePlugin({
          __BASE_URL__: `'${process.env.baseUrl}'`,
          __ID_TOKEN__: `'${process.env.__ID_TOKEN__}'`,
          __ACCESS_TOKEN__: `'${process.env.__ACCESS_TOKEN__}'`
        }),
      ] : [
        // Production plugins, terser > uglify as the latest version doesn't support ES6 anymore
        new TerserPlugin({
          sourceMap: true,
          parallel: true
        })
      ]
    ],
    node: {
      fs: false,
      child_process: false,
      global: true,
      path: false,
      timers: false,
      Buffer: false,
      process: false
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
      port,
      clientLogLevel: 'none',
      hot: true,
      inline: false,
      noInfo: true,
      watchOptions: {
        ignored: /node_modules/,
      },
      stats: "minimal",
      // It is important to tell WebpackDevServer to use the same "root" path
      // as we specified in the config. In development, we always serve from /.
      publicPath,
      historyApiFallback: {
        // Paths with dots should still use the history fallback.
        // See https://github.com/facebookincubator/create-react-app/issues/387.
        disableDotRule: true,
      },
      proxy: [{
        context: ['**', '!/form/**', '!/build/**', '!/favicon.ico'],
        target: `http://localhost:${webpackPort}`,
      }]
    }
  }
}

function getRequiredEnvironmentVars() {
  const access = process.env.__ACCESS_TOKEN__
  const id = process.env.__ID_TOKEN__
  const url = process.env.__BASE_URL__

  if (!access || !id || !url) {
    throw new Error('AccessToken, IdToken and baseUrl is required to initialize custom forms webpack server.'
    )
  }

  return { accessToken: access, idToken: id, baseUrl: url }
}
