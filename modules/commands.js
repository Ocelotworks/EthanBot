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

        bot.prefixCache = {};
        bot.database.getPrefixes()
            .then(function(result){
                 for(var i in result){
                     if(result.hasOwnProperty(i))
                        bot.prefixCache[result[i].server] = result[i].prefix;
                 }
            })
            .catch(function(err){
                bot.error("Error loading prefix cache: ");
                console.error(err);
            });

        bot.on('message', function(user, userID, channelID, message, event){
            try {
                var server = bot.channels[channelID] ? bot.channels[channelID].guild_id : null;
                if ((bot.prefixCache[server] && message.startsWith(bot.prefixCache[server])) || (!bot.prefixCache[server] && message.startsWith("!"))) {
                    var args = message.split(" ");
                    var command = bot.commands[args[0].substring(bot.prefixCache[server]? bot.prefixCache[server].length : 1)];
                    if (command) {
                        command(user, userID, channelID, message, args, event, bot);
                    }
                }
            }catch(e){
                bot.sendMessage({
                    to: channelID,
                    message: ":bangbang: Command failed: "+e
                })
            }
        });
      }
  }
};