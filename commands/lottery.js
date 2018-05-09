/**
 * Created by Peter on 07/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Lottery",
    usage: "lottery [amount]",
    accessLevel: 0,
    commands: ["lottery"],
    init: function init(bot, cb){
        if(!process.env.pm_uptime){
            bot.log("Test mode detected - not running lottery");
            cb();
            return;
        }
          if(!bot.nextDraw){

              bot.nextDraw = parseInt(config.get("Bot.lotteryInterval"))+new Date().getTime();
              bot.doLottery = function doDraw(){
                  if(bot.lotteryTimeout){
                      clearTimeout(bot.lotteryTimeout);
                  }
                  bot.nextDraw = config.get("Bot.lotteryInterval")+new Date().getTime();
                  var winner = {};
                  var total = 0;
                  bot.database.pickLotteryWinner()
                      .then(function(winnerResult){
                          if(!winnerResult[0]){
                              throw new Error("Nobody entered the lottery");
                          }
                          winner.id = winnerResult[0].user;
                          return bot.database.getLotteryInfo();
                      })
                      .then(function(lotteryDetails){
                          total = lotteryDetails[0].total;
                          bot.sendMessage({
                              to: winner.id,
                              message: `:dollar: Congratulations, you have won the lottery jackpot of **${numberWithCommas(total)}** ${config.get("Bot.defaultCurrency")}s!`
                          });
                          return bot.database.getUser(winner.id);
                      })
                      .then(function(winnerDetails){
                          winner.name = winnerDetails[0].username;
                          return bot.database.awardLotteryMoney(winner.id);
                      })
                      .then(function(){
                          return bot.database.getServersWithSetting("lotteryChannel");
                      })
                      .then(function(result){
                          for(var i in result){
                              if(result.hasOwnProperty(i)){
                                  if(bot.servers[result[i].server])
                                      bot.sendMessage({
                                          to: result[i].lotteryChannel,
                                          message: `:dollar: The lottery results are in! Congratulations to **${Object.keys(bot.servers[result[i].server].members).indexOf(winner.id) > -1 ? "<@"+winner.id+">" : winner.name}** for winning ${numberWithCommas(total)} ${config.get("Bot.defaultCurrency")}s!\nNext draw in **1** hour. Enter now with **!lottery [amount]** to have a chance of winning!`
                                      });
                              }
                          }
                      })
                      .catch(function(err){
                          if(err.message.indexOf("Nobody") === -1)
                            bot.error("Error during lottery process: "+err);
                      });
                  bot.lotteryTimeout = setTimeout(bot.doLottery, parseInt(config.get("Bot.lotteryInterval")));
              };
              bot.lotteryTimeout = setTimeout(bot.doLottery, parseInt(config.get("Bot.lotteryInterval")));
          }
          cb();
    },
    run: function run(user, userID, channel, message, args, event, bot){
        var server = bot.channels[channel].guild_id;
        if(!args[1]){
            bot.database.getLotteryInfo()
                .then(function(result){
                   var lottery = result[0];
                   if(lottery.entries > 0){
                       bot.sendMessage({
                           to: channel,
                           message: `:dollar: **${lottery.entries}** total entries. Averaging **${numberWithCommas(parseInt(lottery.averageBet))}** ${config.get("Bot.defaultCurrency")}s per bet, **${numberWithCommas(lottery.total)}** ${config.get("Bot.defaultCurrency")}s in total.\nDraw in **${parseInt((bot.nextDraw-new Date())/1000/60)}** minutes\nEnter the lottery with **${bot.prefixCache[server]}lottery [amount]** `
                       });
                   }else{
                       bot.sendMessage({
                           to: channel,
                           message: `Nobody has entered the lottery yet. Be the first with **${bot.prefixCache[server]}lottery amount**`
                       });
                   }
                });

        }else{
            var amount = parseInt(args[1]);
            if(!amount || amount <= 0){
                bot.sendMessage({
                    to: channel,
                    message: ":bangbang: You must give a valid amount to enter into the lottery!"
                });
            }else{
                bot.database.getBalance(userID)
                    .then(function(result){
                        if(!(result[0] && result[0].balance >= amount)){
                            bot.sendMessage({
                                to: channel,
                                message: `:bangbang: You don't have enough for that! You only have **${numberWithCommas(result[0].balance)}** ${config.get("Bot.defaultCurrency")}${result[0].balance > 1 ? "s" : ""}`
                            });
                        } else {
                            return bot.database.enterLottery(userID, amount);
                        }
                    })
                    .then(function(result){
                        if(result){
                            return bot.database.addBalance(userID,  -amount);
                        }
                    })
                    .then(function(result){
                        if(result){
                            bot.sendMessage({
                                to: channel,
                                message: ":dollar: You have entered the lottery! Good Luck!"
                            });
                        }
                    })
                    .catch(function(err){
                        if(err.message.indexOf("Duplicate") > -1){
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: You've already entered the lottery!"
                            });
                        }else{
                            bot.error("Lottery Error: "+err);
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: Error entering lottery. You have not been charged.\n"+err
                            });
                        }

                    });
            }
        }

    }
};

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}