/**
 * Created by Peter on 20/06/2017.
 */
const async = require('async');
const columnify = require('columnify');
module.exports = {
    name: "Leaderboards",
    usage: "leaderboard [server]",
    accessLevel: 0,
    commands: ["leaderboard", "leaderboards", "top"],
    run: function run(user, userID, channel, message, args, event, bot) {
        bot.simulateTyping();
        bot.database.getLeaderboard(args[1] ? bot.channels[channel].guild_id : null)
            .then(function(leaderboard){
                if(!leaderboard[0]){
                    bot.sendMessage({
                        to: channel,
                        message: "The leaderboard is empty! Strange..."
                    });
                }else{
                    var data = [];
                    var i = 1;
                    async.eachSeries(leaderboard, function(leaderboardUser, cb){
                        data.push({
                            "#": i++,
                            User: leaderboardUser.username,
                            EthanBucks: bot.numberWithCommas(leaderboardUser.balance)
                        });
                        cb();
                    }, function(){
                        bot.sendMessage({
                            to: channel,
                            message: "Top 10:\n```yaml\n"+columnify(data)+"\n```"
                        });
                    });
                }
            })
            .catch(function(err){
                bot.error("Leaderboard Error:"+err);
                bot.sendMessage({
                    to: channel,
                    message: ":bangbang: There was en error generating the leaderboard: \n"+err
                });
            })


    }
};