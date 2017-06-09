/**
 * Created by Peter on 08/06/2017.
 */
const config = require('config');
module.exports = {
    name: "",
    usage: "",
    accessLevel: 10,
    commands: ["admin"],
    run: function run(user, userID, channel, message, args, event, bot){
        //noinspection EqualityComparisonWithCoercionJS
        if(userID == "139871249567318017"){
            var command = args[1];
            switch(command){
                case "leave":
                    bot.leaveServer(args[2]);
                    break;
                case "clearmq":
                    bot.messageQueue = [];
                    bot.sendMessage({
                        to: channel,
                        message: "Done."
                    });
                    break;
                case "eval":
                    eval(message.substring(12));
                    break;
                case "restart":
                    process.exit(1);
                    break;
                case "stats":
                    bot.sendMessage({
                        to: channel,
                        message: `Currently active in **${Object.keys(bot.servers).length}** servers. ${parseInt(process.uptime()/60)} minutes uptime.`
                    });
                    break;
                case "forcelottery":
                    bot.doLottery();
                    break;
                case "take":
                    bot.database.transact(args[2].replace(/[!@<>]/g, ""), userID, args[3])
                        .then(function(){
                            bot.sendMessage({
                                to: channel,
                                message: `:dollar: Taken **${args[3]}** ${config.get("Bot.defaultCurrency")}s from <@${args[2]}>`
                            });
                        });
                    break;

            }
        }

    }
};