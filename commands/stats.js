/**
 * Created by Peter on 09/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Stats Command",
    usage: "stats",
    accessLevel: 0,
    commands: ["stats", "statistics"],
    run: function run(user, userID, channel, message, args, event, bot) {
        bot.database.getStats()
            .then(function(stats){
                console.log(stats);
               bot.sendMessage({
                   to: channel,
                   message: "",
                   embed: {
                       color: 0x5D5DFF,
                       title: "",
                       description: "",
                       fields: [
                           {
                               name: "Total Servers",
                               value: Object.keys(bot.servers).length,
                               inline: true
                           },
                           {
                               name: "Total Users",
                               value: Object.keys(bot.users).length,
                               inline: true
                           },
                           {
                               name: "Current Uptime",
                               value: parseInt(process.uptime()/60)+" minutes",
                               inline: true
                           },
                           {
                               name: "Total Balance",
                               value: `${stats[0].totalBalance} ${config.get("Bot.defaultCurrency")}s`,
                               inline: true
                           },
                           {
                               name: "Average Balance",
                               value: `${stats[0].averageBalance} ${config.get("Bot.defaultCurrency")}s`,
                               inline: true
                           }
                       ],
                       author: {
                           name: "EthanBot Statistics",
                           icon_url: "https://cdn.discordapp.com/avatars/322031850329604096/2963e8aa5e9d1a46605caa5287b6aeea.webp"
                       }
                   }
               })
            });
    }
};