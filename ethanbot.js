/**
 * Created by Peter on 07/06/2017.
 */
const   config      = require('config'),
        Discord     = require('discord.io'),
        dateFormat  = require('dateformat'),
        colors      = require('colors'),
        caller_id   = require('caller-id'),
        path        = require('path'),
        async       = require('async');

var bot = new Discord.Client({
    autorun: false,
    token: config.get("Discord.token")
});


function initBot(cb){

    bot.wasConnected = false;
    bot.errorCount = 0;
    bot.commandCount = 0;
    bot.lastCrash = new Date();
    bot.PARSER = /[!<>@#&]/g;
    bot.numberWithCommas = function(x){
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    bot.log = function log(message, caller, logged){
        if(!caller)
            caller = caller_id.getData();
        var file = ["Nowhere"];
        if(caller.filePath)
            file = caller.filePath.split(path.sep);

        var origin = `[${file[file.length-1]}${caller.functionName ? path.sep+caller.functionName : ""}] `.bold;

        var output = origin+message;
        console.log(`[${dateFormat(new Date(), "dd/mm/yy hh:MM")}]`+output);

        if(bot.database && !logged){
            bot.database.log(message,file[file.length-1]+(caller.functionName ? path.sep+caller.functionName : ""))
                .catch(function(err){
                    console.error("ERROR LOGGING MESSAGE!!! "+err);
                });
        }

    };

    bot.error = function error(message){
        var caller = caller_id.getData();
        var file = ["Nowhere"];
        if(caller.filePath)
            file = caller.filePath.split(path.sep);
        if(bot.database)
            bot.database.log(message,file[file.length-1]+(caller.functionName ? path.sep+caller.functionName : ""), "ERROR")
                .catch(function(err){
                    console.error("ERROR LOGGING ERROR!!! "+err);
                });
        bot.log(message.red, caller, true);
        bot.errorCount++;
    };

    bot.warn = function warn(message){
        var caller = caller_id.getData();
        var file = ["Nowhere"];
        if(caller.filePath)
            file = caller.filePath.split(path.sep);
        if(bot.database)
            bot.database.log(message,file[file.length-1]+(caller.functionName ? path.sep+caller.functionName : ""), "WARN")
                .catch(function(err){
                    console.error("ERROR LOGGING WARNING!!! "+err);
                });
        bot.log(message.yellow, caller, true);
    };

    bot.log("EthanBot Loading...");

    bot.messageQueue = [];
    bot.messageCount = 0;
    bot.totalMessageTime = 0;
    bot.isHandlingMessageQueue = false;
    bot.sendMessageForReal = bot.sendMessage;
    bot.handleMessageQueue = function handleMessageQueue(){
        var messageParams = bot.messageQueue.pop();
        if(messageParams){
            bot.isHandlingMessageQueue = true;
            bot.sendMessageForReal(messageParams.args, messageParams.cb);
            bot.messageCount++;
            bot.totalMessageTime = new Date() - messageParams.sentAt;
            setTimeout(bot.handleMessageQueue, parseInt(config.get("Discord.messageDelay")));
        }else{
            bot.isHandlingMessageQueue = false;
        }
    };
    bot.sendMessage = function sendMessage(args, cb){
        bot.messageQueue.push({
            args: args,
            cb: cb,
            sentAt: new Date()
        });
        if(!bot.isHandlingMessageQueue)
            bot.handleMessageQueue();
    };

    bot.loadBefore = config.get("Modules.LoadBefore");
    bot.loadAfter = config.get("Modules.LoadAfter");

    initModules(bot.loadBefore, function(){
        startBot(function(){
            initModules(bot.loadAfter, cb);
        });
    });
}

function initModules(modules, cb){
    bot.log(`Loading ${modules.length} modules...`);
    async.eachSeries(modules, function loadModule(module, callback){
        var loadedModule = require('./modules/'+module)(bot);
        bot.log(`Loading ${loadedModule.name}...`);
        loadedModule.init(callback);
    }, cb);
}

function startBot(cb){
    bot.on("ready", function(){
       bot.log("Bot connected");
       if(cb && !bot.wasConnected){
           bot.wasConnected = true;
           cb();
       }
    });

    bot.on("disconnect", function(err){
       bot.warn("Disconnected... Reconnecting in 1 second "+err);
       setTimeout(bot.connect, 1000);
    });

    bot.on("guildMemberAdd", function(member, event){
        var username = bot.users[member.id].username+"#"+bot.users[member.id].discriminator;
        var server = event.d.guild_id;
        bot.database.getServer(server)
            .then(function(result){
                var serverInfo = result[0];
                if(serverInfo.useServerCurrency){
                   return bot.database.createServerUser(server, member.id, username);
                }
            })
            .then(function(result){
                if(result)
                    bot.log(`Added server user ${member.id} ${username} ${server}`);
            })
            .catch(function(err){
                if(err.message.indexOf("Duplicate") > -1){
                    bot.log(`User ${member.id} ${username} already exists on ${server}`);
                }else
                bot.error(`Error adding server user: ${member.id} ${username} ${server}: ${err}`)
            });

        bot.database.addUser(member.id, username)
            .then(function(){
                bot.log(`Added user ${member.id}: ${username}`);
            })
            .catch(function(err){
                if(err.message.indexOf("Duplicate") > -1){
                    bot.log(`User ${member.id} ${username} already exists.`);
                }else
               bot.error(`Error adding user ${member.id}/${username}: ${err}`);
            });
    });

    bot.on("guildCreate", function(server){
        bot.log("Joined Server "+server.name);
        bot.database.addAllUsers(server.id);
    });

    bot.log("Connecting to Discord...");
    bot.connect();
}

initBot(function(){
    bot.log("Ready");
});


process.on("uncaughtException", function(err){
    bot.database.log(err.stack, err.message, "CRASH")
        .then(function(){
            bot.knex.client.pool.drain(bot.knex.client.pool.destroyAllNow);
            bot.disconnect();
            setTimeout(function(){
                process.exit(1);
            }, 1000);
        })
        .catch(function(){
            process.exit(1);
        });
});

process.on('unhandledRejection', function(reason){
    bot.database.log("Unhandled Rejection", reason || "No Reason Given", "ERROR")
        .catch(function(err){
            console.error("Error logging unhandled rejection "+err);
        });
});


process.on('beforeExit', function(){
   bot.log("Exiting...");
    bot.knex.client.pool.drain(bot.knex.client.pool.destroyAllNow);
    bot.disconnect();
    setTimeout(function(){
        process.exit(1);
    }, 1000);
});

process.on('warning', function(warning){
    bot.warn("Node warning: "+warning.message);
});