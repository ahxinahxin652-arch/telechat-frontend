const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.vue', '.json']
    }
  },
  chainWebpack: config => {
    // 设置入口文件
    config.entry('app').clear().add('./src/main.ts')

    // 配置 ts-loader
    config.module
        .rule('ts')
        .test(/\.ts$/)
        .use('ts-loader')
        .loader('ts-loader')
        .options({
          transpileOnly: true,
          appendTsSuffixTo: [/\.vue$/]
        })
  }
})