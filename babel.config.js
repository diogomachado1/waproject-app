module.exports = {
  presets: ['module:metro-react-native-babel-preset', 'module:react-native-dotenv'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.ts', '.tsx', '.ios.js', '.android.js']
      }
    ],
    '@babel/plugin-transform-runtime'
  ],
  env: {
    production: {
      plugins: ['transform-remove-console']
    }
  }
};
