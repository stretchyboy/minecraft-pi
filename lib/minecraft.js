 //     minecraft-pi-vec3 0.2.0
 //     (c) 2013 Zachary Bruggeman <talkto@zachbruggeman.me>
 //     (c) 2014 Martyn Eggleton <martyn@edumake.org>
 //     minecraft-pi is licensed under the MIT license.

 
// ## Dependencies
var net    = require('net');
var os     = require('os');
var Blocks = require('./blocks.json');
var Colors = require('./colors.json');
var v= require("vec3");

// ## Constructor
function Minecraft (host, port, callback) {
    var self = this;

    this.connection = net.connect(port, host, function () {
        // When a new `Minecraft` is created, it connects to the port and host given, and preforms the callback, if it exists, once connected.
        console.log('Connected to server!');
        //self.chat('Hello from Node.js! Commanding from '  + os.hostname());
        if (callback) {
            callback();
        }
    });

    this.connection.on('end', function() {
        console.log('Server disconnected.');
    });
}

// `Blocks` holds names of each block, tied to an item ID. This allows for an easier way to reference blocks.
Minecraft.prototype.blocks = Blocks;

// `Colors` holds color data codes, which are used to create colored wool.
Minecraft.prototype.colors = Colors;

// If you're wanting to write your own API, make sure that your commands written end with a new line! Without it, the commands will not work.
Minecraft.prototype.send = function (command) {
    this.connection.write(command + '\n');
};

// When writing a custom callback, make sure to end the connection with `client.end()`.
Minecraft.prototype.sendReceive = function (command, callback) {
    var self = this;
    var defaultCallback = function (data) {
        self.connection.end();
    };
    var callb = callback ? callback : defaultCallback;

    this.send(command);
    this.connection.once('data', callb);
};

Minecraft.prototype.addListener = function (command, callback) {
    var self = this;
    var defaultCallback = function (data) {
        console.log(data.toString());
        self.connection.end();
    };
    var callb = callback ? callback : defaultCallback;

    this.send(command);
    this.connection.on('data', callb);
};

Minecraft.prototype.end = function () {
    this.connection.destroy();
};

// ## Commands

// ### World Commands
// `client.getBlock(P, callback)` -- Returns the block ID at the selected Vector.
Minecraft.prototype.getBlock = function (P, callback) {
    return this.sendReceive('world.getBlock(' + P.x + ',' + P.y + ',' + P.z + ')', function(sBlockid){
            var iBlockid = parseInt(sBlockid,10);
            callback.call(this, iBlockid);
    });
};

// `client.getBlockName(id)` -- Returns the block name from a block ID.
Minecraft.prototype.getBlockName = function(id){ 
    var filtered = Object.keys(Blocks).filter(function(element){
        return (Blocks[element] === id);
    });
    //console.log("filtered =", filtered);
    if(filtered.length)
    {
        return filtered[0];
    }
    return "Not Found";
};


// `client.setBlock(P, id, [data])` -- Places a block with the ID of `id` at the selected coordinates, plus data if it is appended. You can use `client.blocks['BLOCK_NAME']` instead of the actual ID.
Minecraft.prototype.setBlock = function (P, id, data) {
    var command = data ? this.send('world.setBlock(' + P.x + ',' + P.y + ',' + P.z + ',' + id + ',' + data + ')') : this.send('world.setBlock(' + P.x + ',' + P.y + ',' + P.z + ',' + id + ')');
    return command;
};

// `client.setBlocks(P1, P2, id, [data])` -- Places a cuboid of blocks with the coordinate set using the specified id and data. You can use `client.blocks['BLOCK_NAME']` instead of the actual ID.
Minecraft.prototype.setBlocks = function (P1, P2, id, data) {
    var command = data ? this.send('world.setBlocks(' + P1.x + ',' + P1.y + ',' + P1.z + ',' + P2.x + ',' + P2.y + ',' + P2.z + ',' + id + ',' + data + ')') : this.send('world.setBlocks(' + P1.x + ',' + P1.y + ',' + P1.z + ',' + P2.x + ',' + P2.y + ',' + P2.z + ',' + id + ')');
    return command;
};

// `client.getHeight(P, callback)` -- Returns the Y coordinate of the last block that isn't solid from the top-down in the coordinate pair.
Minecraft.prototype.getHeight = function (P, callback) {
    return this.sendReceive('world.getHeight(' + P.x + ',' + P.z + ')', function(h){var Q = P.clone(); Q.y = parseInt(h,10); callback.call(this,Q);});
};

// `client.saveCheckpoint()` -- Saves a checkpoint that can be used to restore the world.
Minecraft.prototype.saveCheckpoint = function () {
    return this.send('world.checkpoint.save()');
};

// `client.restoreCheckpoint()` -- Restores to the last checkpoint.
Minecraft.prototype.restoreCheckpoint = function () {
    return this.send('world.checkpoint.restore()');
};

// `client.worldSetting(key, value)` -- Sets a world property.
// 
// Values are boolean, 0 or 1. The current two keys are:
// 
// * `world_immutable`
// * `nametags_visible`
Minecraft.prototype.worldSetting = function (key, value) {
    return this.send('world.setting(' + key + ',' + value + ')');
};

// `client.getPlayerIds(callback)` -- Returns the entity IDs of the players online.
Minecraft.prototype.getPlayerIds = function (callback) {
    return this.sendReceive('world.getPlayerIds()');
};

// `client.chat(message)` -- Displays a message in the chat.
Minecraft.prototype.chat = function (message) {
    return this.send('chat.post(' + message + ')');
};

// ### Camera Commands
// `client.setCameraMode(mode)` -- Sets the player's camera mode. Accepts `normal`, `thirdPerson` and `fixed`.
Minecraft.prototype.setCameraMode = function (mode) {
    var self = this;
    switch (mode) {
        case 'normal':
        return self.send('camera.mode.setNormal()');
        break;
        case 'thirdPerson':
        return self.send('camera.mode.setThirdPerson()');
        break;
        case 'fixed':
        return self.send('camera.mode.setFixed()');
        break;
    }
};

// `client.setCameraPosition(P)` -- Sets the camera's position at the selected coordinates.
Minecraft.prototype.setCameraPosition = function (P) {
    return this.send('camera.mode.setPos(' + P.x + ',' + P.y + ',' + P.z + ')');
};

// ### Player commands
// `client.getTile()` -- Gets the player's coordinates to the nearest block.
Minecraft.prototype.getTile = function (callback) {
    return this.sendReceive('player.getTile()', function(data){
            var aData = data.toString().trim().split(",");
            var playerposition = v(parseInt(aData[0],10), parseInt(aData[1],10), parseInt(aData[2],10));
            callback.call(this, playerposition);
});};

// `client.setTile(P)`-- Sets the player's coordinates to the specified block.
Minecraft.prototype.setTile = function (P) {
    return this.send('player.setTile(' + P.x + ',' + P.y + ',' + P.z + ')');
};

// `client.getPos()` -- Gets the precise position of the player.
Minecraft.prototype.getPos = function (callback) {
    return this.sendReceive('player.getPos()', function(data){
            var aData = data.toString().trim().split(",");
            var playerposition = v(parseFloat(aData[0],10), parseFloat(aData[1],10), parseFloat(aData[2],10));
            callback.call(this, playerposition);
});};


// `client.setPos(P)` -- Sets the position of the player precisely.
Minecraft.prototype.setPos = function (P) {
    return this.send('player.setPos(' + P.x + ',' + P.y + ',' + P.z + ')');
};

// `client.playerSetting(key, value)` -- Sets a player property.
// 
// Values are boolean, 0 or 1. The current key available is:
// 
// * `autojump`
Minecraft.prototype.playerSetting = function (key, value) {
    return this.send('player.setting(' + key + ',' + value + ')');
};

// ### Event commands
// These are in need of proper documentation. If you know about these, please send a pull request! :-)
Minecraft.prototype.eventsBlockHits = function(callback) {
    return this.addListener('events.block.hits()', callback);
};

Minecraft.prototype.eventsClear = function() {
    return this.send('events.clear()');
};

// ### Direction commands
// Calculations of up down etc.
Minecraft.prototype.directioncalcs = {
  "up":   function(pos, distance){return pos.plus(v(0,distance,0));},
  "down": function(pos, distance){return pos.plus(v(0,distance*-1,0));},
  "north":function(pos, distance){return pos.plus(v(0,0,distance));},
  "south":function(pos, distance){return pos.plus(v(0,0,distance*-1));},
  "west": function(pos, distance){return pos.plus(v(distance,0,0));},
  "east": function(pos, distance){return pos.plus(v(distance*-1,0,0));},
  "none": function(pos, distance){return pos.clone();}
};

Minecraft.prototype.directions = ['up', 'down', 'north', 'south','east','west','none'];


// ## Exports
module.exports = Minecraft;
