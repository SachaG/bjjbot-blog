/**
 * Dependencies
 */

var parsePackageJson = require('./parse-package-json'),
    Promise = require('bluebird'),
    join = require('path').join,
    fs = require('fs'),

    statFile = Promise.promisify(fs.stat),
    readDir = Promise.promisify(fs.readdir);

/**
 * Recursively read directory
 */

function readDirectory(dir, options) {
    var ignore;

    if (!options) {
        options = {};
    }

    ignore = options.ignore || [];
    ignore.push('node_modules', 'bower_components', '.DS_Store');

    return readDir(dir)
        .filter(function (filename) {
            return ignore.indexOf(filename) === -1;
        })
        .map(function (filename) {
            var absolutePath = join(dir, filename);

            return statFile(absolutePath).then(function (stat) {
                var item = {
                    name: filename,
                    path: absolutePath,
                    stat: stat
                };

                return item;
            });
        })
        .map(function (item) {
            if (item.name === 'package.json') {
                return parsePackageJson(item.path).then(function (pkg) {
                    item.content = pkg;

                    return item;
                });
            }

            if (item.stat.isDirectory()) {
                return readDirectory(item.path).then(function (files) {
                    item.content = files;

                    return item;
                });
            }

            // if there's no custom handling needed
            // set absolute path as `item`'s `content`
            item.content = item.path;

            return item;
        })
        .then(function (items) {
            var tree = {};

            items.forEach(function (item) {
                tree[item.name] = item.content;
            });

            return tree;
        });
}

/**
 * Expose `readDirectory`
 */

module.exports = readDirectory;
