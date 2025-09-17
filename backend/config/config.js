const path = require('path');

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0'
  },
  ansible: {
    configDir: path.join(__dirname, '../ansible'),
    inventory: path.join(__dirname, '../ansible/inventory/hosts.ini'),
    playbooks: path.join(__dirname, '../ansible/playbooks'),
    scripts: path.join(__dirname, '../ansible/scripts'),
    templates: path.join(__dirname, '../ansible/templates'),
    logs: path.join(__dirname, '../../logs')
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'ansible-web-secret-key',
    saltRounds: 10
  },
  websocket: {
    port: 8080
  }
};
