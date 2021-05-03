const express = require('express')
const app = express()
const server = require('http').createServer(app)
const port = 3000
const io = require('socket.io')(server)
const path = require('path')
const fetch = require("node-fetch")



let ATIS = {}


io.on('connection', socket => {
  setTimeout(function(){
  socket.emit("chat", {message: "<strong><a style=\"color: #ffd700\">[MFSLINK-CUSTOM-SERVER INFO]</a>:</strong> You are currently chatting in a custom server, which is NOT maintained by mfslink developers team. Server Owners are responsible of updating to latest server version. No notifications will be sent to server owners when a old version becomes deprecated or when a new version is out.", channel: "UNICOM_122.800"})
  }, 3500)

  socket.on('chat', async message => {
    let msg;
    let atc = false;
    let callsign = message.callsign.split('_');
    if(callsign.length !== 2){
      msg = "<strong>" + message.callsign + "[" + new Date().toUTCString() + "]:</strong> " + message.message;
    }else{
      if(["GND", "TWR", "CRD", "APP", "DEP"].includes(callsign[1])){
        msg = "<strong><a style=\"color: #ffd700\">[ATC]</a>" + message.callsign + "[" + new Date().toUTCString() + "]:</strong> " + message.message;
        atc = true;
      }else{
        msg = "<strong>" + message.callsign + "[" + new Date().toUTCString() + "]:</strong> " + message.message;
      }
    }

    if(message.message.startsWith("!") == false){

      socket.broadcast.emit("chat", { message: msg, channel: message.channel })

    }else{
      if(message.message.slice(1).toLowerCase().startsWith("metar")){
        let args = message.message.slice(1).toLowerCase().split(" ")
        if(args.length !== 2){
          socket.emit("chat", { message: "<strong><a style=\"color: #ffd700\">[ROBOT]</a></strong> A ICAO code must be provided.", channel: message.channel })
        }

        let metar = await fetch("https://nightbot-clip-command.herokuapp.com/metar?icao=" + args[1])
        let met = await metar.text()
        socket.emit("chat", { message: "<strong><a style=\"color: #ffd700\">[ROBOT]</a></strong> " + met, channel: message.channel })
      }else if(message.message.slice(1).toLowerCase().startsWith("setatis")){

        let cs = message.callsign.split('_');

        if(cs.length !== 2)return;

        if(["GND", "TWR", "CRD"].includes(cs[1].toUpperCase()) == false)return;


        let args = message.message.slice(1).toLowerCase().split(" ")
        args.shift();
        let apt = args[0]
        if(args[0].length !== 4){
          socket.emit("chat", { message: "<strong><a style=\"color: #ffd700\">[ROBOT]</a></strong> A ICAO code must be provided.", channel: message.channel })
        }

        args.shift();
        let final = args.join(" ")
        ATIS[apt] = final.toUpperCase()

        socket.emit("chat", { message: "<strong><a style=\"color: #ffd700\">[ROBOT]</a></strong> ATIS for " + apt + " has been set to " + ATIS[apt], channel: message.channel })
      }else if(message.message.slice(1).toLowerCase().startsWith("atis")){

        let args = message.message.slice(1).toLowerCase().split(" ")
        args.shift();
        let apt = args[0]
        if(args[0].length !== 4){
          socket.emit("chat", { message: "<strong><a style=\"color: #ffd700\">[ROBOT]</a></strong> A ICAO code must be provided.", channel: message.channel })
        }
        if(ATIS[apt] == undefined){
        socket.emit("chat", { message: "<strong><a style=\"color: #ffd700\">[ROBOT]</a></strong> ATIS for " + apt + " have not been set!", channel: message.channel })

        }else{
        socket.emit("chat", { message: "<strong><a style=\"color: #ffd700\">[ROBOT]</a></strong> " + ATIS[apt], channel: message.channel })
        }
      }
    }
    socket.emit("chat", { message: msg, channel: message.channel })
  })

  socket.on("ping", message => {
    socket.emit("pong", { status: 200, message: "OK", id: message.id })
  })
})

server.listen(port, () => {
  console.log(`Server running on port: ${port}`)
})