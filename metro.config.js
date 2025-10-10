const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurações para melhor suporte web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Adicionar suporte para extensões web específicas
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

// Configurações para fontes e assets
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Otimizações para web
if (process.env.EXPO_PLATFORM === 'web') {
  config.transformer.minifierConfig = {
    keep_fargs: true,
    mangle: {
      keep_fnames: true,
    },
  };
}

module.exports = config;