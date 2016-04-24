
// TODO remove polyfill in nodejs4
var objectAssign = require('object-assign');
var arrayFindIndex = require('array-find-index');

var glob = require('glob');
var pathToRegexp = require('path-to-regexp');
var Q = require('q');
var SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency');

function fetchEntries(pattern) {
  var keys = [];
  var re = pathToRegexp(pattern, keys);
  var nameIndex = arrayFindIndex(keys, function(key) {
    return key.name === 'name';
  });
  return Q.nfapply(glob, [pattern.replace(/:\w+/, '*')])
    .then(function(paths) {
      var entries = {};
      paths.forEach(function(path) {
        var name = re.exec(path)[nameIndex + 1];
        entries[name] = path;
      });
      return entries;
    });
}

function WebpackEntriesPlugin() {

}

WebpackEntriesPlugin.prototype.apply = function(compiler) {
  if (!Array.isArray(compiler.options.entries)) {
    compiler.options.entries = [compiler.options.entries];
  }
  compiler.plugin('compilation', function(compilation, params) {
    compilation.dependencyFactories.set(SingleEntryDependency, params.normalModuleFactory);
  });
  compiler.plugin('watch-run', function(watching, callback) {
    // only if watching
    compiler.plugin('this-compilation', function(compilation) {
      // on the main compilation instance
      compilation.plugin('record', function() {
        // before almost all done, add entries to contextDependencies
        // so it would be watched
        Object.keys(compilation.foundEntries).forEach(function(entry) {
          compilation.contextDependencies.push(compilation.foundEntries[entry]);
        });
      });
    });
    callback();
  });

  compiler.plugin('make', function(compilation, callback) {
    Q.all(compiler.options.entries.map(fetchEntries))
      .then(function(entriesList) {
        compilation.foundEntries = objectAssign.apply(null, entriesList);
        return Object.keys(compilation.foundEntries);
      })
      .invoke('map', function(entry) {
        var deferred = Q.defer();
        compilation.addEntry(
          compiler.options.context,
          new SingleEntryDependency(compilation.foundEntries[entry]),
          entry,
          deferred.makeNodeResolver()
        );
        return deferred.promise;
      })
      .all()
      .nodeify(callback);
  });
};

module.exports = WebpackEntriesPlugin;
