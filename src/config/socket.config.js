const { Server } = require('socket.io');

let _io;

const setIO = (server) => {
    _io = new Server(server, {
        cors: {
            origin: "*"
        }
    });
    return _io;
};

const getIO = () => {
    return _io;
};

module.exports = { setIO, getIO };