const http = require('http');
const path = require('path');
const fs = require('fs')
const fsPromises = require('fs').promises

const logEvents = require('./logEvents');
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {};

const myEmitter = new MyEmitter();

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
    console.log(req.url, req.method);

    let filePath;

    if (req.url === '/' || req.url === 'index.html') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        filePath = path.join(__dirname, 'views', 'index.html');
        fs.readFile(filePath, 'utf-8', (err, data) => {
            res.end(data);
        });
    }
})

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// myEmitter.on('log', (mes) => logEvents(mes));
// setTimeout(() => {
//     myEmitter.emit('log', 'log event emitted!\n');
// }, 2000)