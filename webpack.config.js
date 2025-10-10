// webpack.config.js - Configurações específicas para web
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Configurações para responsividade
  config.module.rules.push({
    test: /\.css$/,
    use: ['style-loader', 'css-loader', 'postcss-loader'],
  });
  
  // Otimizações para diferentes tamanhos de tela
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
  };
  
  // Configurações de performance
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  };
  
  return config;
};