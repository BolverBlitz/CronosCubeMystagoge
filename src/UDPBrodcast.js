const dgram = require('dgram');
const server = dgram.createSocket('udp4');


/**
 * 
 * @param {string} data
 * @returns {string}
 * 
 */

let SendUDP = function(data) {
	return new Promise(function(resolve, reject) {
        server.send(data, 0, data.length, "4210", "192.168.10.20", function(err, bytes) {
            resolve("Send")
        });
    });
}

module.exports = {
	SendUDP
};