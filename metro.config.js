// Metro, para la version web (fase 10, cambio 86). expo-sqlite en web corre
// SQLite compilado a wasm: Metro tiene que servir los .wasm.
//
// La doc pide ademas los headers COEP y COOP para tener SharedArrayBuffer, pero
// expo-sqlite solo lo usa en las operaciones sincronicas y la app usa solo las
// asincronicas: sin esos headers funciona, y se puede publicar en cualquier
// hosting estatico.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

module.exports = config;
