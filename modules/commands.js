/**
 * Created by Peter on 07/06/2017.
 */
const fs = require('fs');
const async = require('async');
module.exports = function(bot){
  return {
      name: "Commands Module",
      enabled: true,
      init: function init(cb){
        bot.log("Loading Commands...");
        bot.commands = {};
        bot.commandUsages = {};
        fs.readdir("commands", function readCommands(err, files){
            if(err){
                bot.error("Error reading from commands directory");
                bot.error(err);
                cb(err);
            }else{
                async.eachSeries(files, function loadCommands(command, callback){
                    var loadedCommand = require("../commands/"+command);
                    if(loadedCommand.init){
                        loadedCommand.init(bot, function(){
                            bot.log(`Performed startup tasks for ${loadedCommand.name}`);
                        });
                    }
                    bot.log(`Loaded command ${loadedCommand.name}`);
                    bot.commandUsages[loadedCommand.name] = {
                        usage: loadedCommand.usage,
                        accessLevel: loadedCommand.accessLevel
                    };
                    for(var i in loadedCommand.commands){
                        if(loadedCommand.commands.hasOwnProperty(i)) {
                            bot.commands[loadedCommand.commands[i]] = loadedCommand.run;
                        }

                    }
                    callback();
                }, cb)
            }
        });

        bot.on('message', function(user, userID, channelID, message, event){
            if(message.startsWith("!")){

                var args = message.split(" ");
                var command = bot.commands[args[0].substring(1)];
                if(command){
                    command(user, userID, channelID, message, args, event, bot);
                }
            }
        });
      }
  }
};