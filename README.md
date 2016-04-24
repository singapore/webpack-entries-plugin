# webpack-entries-plugin

Automatically detect webpack entries

# Why

- Webpack watch option does not allow for detecting new entries
- I needed a solution that automatically scans folders and detect entry names

## Installation

`npm install --save-dev webpack-entries-plugin`

## Setup
In `webpack.config.js`:

```js
const WebpackEntriesPlugin = require('webpack-entries-plugin');
const resolve = require('path').resolve;

module.exports = {
  ...
  entries: [
    resolve('lib/client/entries/:name'), // `:name` will automatically be mapped as entry name
    resolve('lib/other/:name/client')
  ],
  plugins: [
    new WebpackEntriesPlugin()
  ],
  ...
}
```
