const logEvents = require('./logEvents');

const EventEmitter = require('events');

class MyEmitter extends EventEmitter {};

const myEmitter = new MyEmitter();

myEmitter.on('log', (mes) => logEvents(mes));
setTimeout(() => {
    myEmitter.emit('log', 'log event emitted!\n');
}, 2000)