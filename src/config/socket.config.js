import { Server } from "socket.io";

let _io;

export const setIO = (server) => {
    _io = new Server(server, {
        cors: {
            origin: "*"
        }
    })
    return _io;
}

export const getIO = () => {
    return _io;
}