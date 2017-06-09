/**
 * Created by Peter on 07/06/2017.
 */
const   config      = require('config'),
        Discord     = require('discord.io'),
        dateFormat  = require('dateformat'),
        colors      = require('colors'),
        caller_id   = require('caller-id'),
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

    bot.log = function log(message, caller){
        if(!caller)
            caller = caller_id.getData();
        var file = ["Nowhere"];
        if(caller.filePath)
            file = caller.filePath.split("\\");

        var origin = `[${file[file.length-1]}${caller.functionName ? "/"+caller.functionName : ""}] `.bold;

        var output = origin+message;
        console.log(`[${dateFormat(new Date(), "dd/mm/yy hh:MM")}]`+output);
    };

    bot.error = function error(message){
        bot.log(message.red, caller_id.getData());
        bot.errorCount++;
    };

    bot.warn = function warn(message){
        bot.log(message.yellow, caller_id.getData());
    };

    bot.log("EthanBot Loading...");

    bot.messageQueue = [];
    bot.isHandlingMessageQueue = false;
    bot.sendMessageForReal = bot.sendMessage;
    bot.handleMessageQueue = function handleMessageQueue(){
        var messageParams = bot.messageQueue.pop();
        if(messageParams){
            bot.isHandlingMessageQueue = true;
            bot.sendMessageForReal.apply(bot, messageParams);
            setTimeout(bot.handleMessageQueue, parseInt(config.get("Discord.messageDelay")));
        }else{
            bot.isHandlingMessageQueue = false;
        }
    };
    bot.sendMessage = function sendMessage(args, cb){
        bot.messageQueue.push([args, cb]);
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

    bot.on("guildMemberAdd", function(member){
        var username = bot.users[member.id].username+"#"+bot.users[member.id].discriminator;
        bot.database.addUser(member.id, username)
            .then(function(){
                bot.log(`Added user ${member.id}: ${username}`);
            })
            .catch(function(err){
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