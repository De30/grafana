const { writeFile } = require('fs').promises;

class BuildMetaPlugin {
  constructor(options) {
    this.options = {
      filename: 'build_meta.json',
      generator: (stats) => {
        const output = {
          buildHash: stats.hash,
        };
        return JSON.stringify(output, null, 2);
      },
      ...options,
    };
  }
  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.done.tapAsync('BuildMetaPlugin', async (stats, callback) => {
      const result = this.options.generator(stats);
      try {
        await writeFile(this.options.filename, result);
        callback();
      } catch (err) {
        return callback(err);
      }
    });
  }
}

module.exports = BuildMetaPlugin;
