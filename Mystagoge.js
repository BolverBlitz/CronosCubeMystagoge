//Include needed jsons
var config = require('./config');
var secret = require('./secret');

//Include some Funktions
const f = require('./src/Funktions');
const OS = require('./src/Hardware');

//Include some modules

const newI18n = require("new-i18n");
const i18n = newI18n(__dirname + "/languages", ["de","en","fr"], config.fallbacklanguage);

//Include complex modules
const Telebot = require('telebot');
const bot = new Telebot({
	token: secret.bottoken,
	limit: 1000,
        usePlugins: ['commandButton']
});

var Time_started = new Date().getTime();

bot.start(); //Telegram bot start

//Telegram Errors
bot.on('reconnecting', (reconnecting) => {
	f.log("Lost connection");
	var LastConnectionLost = new Date();
});
bot.on('reconnected', (reconnected) => {
	f.log("connection successfully");
	bot.sendMessage(config.LogChat, "Bot is back online. Lost connection at " + f.getDateTime(LastConnectionLost))
});

/*---------------------- Telegram Commands --------------------------*/

bot.on(/^\/alive$/i, (msg) => {
	OS.Hardware.then(function(Hardware) {
		let Output = "";
		Output = Output + '\n- CPU: ' + Hardware.cpubrand + ' ' + Hardware.cpucores + 'x' + Hardware.cpuspeed + ' Ghz';
		Output = Output + '\n- Load: ' + f.Round2Dec(Hardware.load);
		Output = Output + '%\n- Memory Total: ' + f.Round2Dec(Hardware.memorytotal/1073741824) + ' GB'
		Output = Output + '\n- Memory Free: ' + f.Round2Dec(Hardware.memoryfree/1073741824) + ' GB'
			msg.reply.text("Botname: " + config.botname + "\nVersion: " + config.version + "\nUptime: " + f.uptime(Time_started) + "\n\nHardware:" + Output).then(function(msg)
			{
				setTimeout(function(){
				bot.deleteMessage(msg.chat.id,msg.message_id).catch(error => f.Elog('Error (deleteMessage):', error.description));
				}, config.WTdelmsglong);
            });
             bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error (deleteMessage):', error.description));
	});
});

bot.on(['/start', '/help'], (msg) => {

	//Language dedection
    if ('language_code' in msg.from) {
        if (i18n.languages.includes(msg.from.language_code)) {
			f.log("User: " + msg.from.username + " (" + msg.from.language_code + ") has started the bot with a language that is supported.")
			var LanguageForFunktion = msg.from.language_code
        }else{
			f.log("User: " + msg.from.username + " (" + msg.from.language_code + ") has started the bot with a language that is not supported.")
			var LanguageForFunktion = config.language
		}
    }else{
		f.log("User: " + msg.from.username + " has started the bot without a language code.")
		var LanguageForFunktion = config.language
	}

	let replyMarkup = bot.inlineKeyboard([
		[
			bot.inlineButton(i18n(LanguageForFunktion, LanguageForFunktion), {callback: 'language_' + msg.from.id + '_' + LanguageForFunktion})
		],[
			bot.inlineButton(i18n(LanguageForFunktion, 'JoinMystagoge'), {callback: 'M_' + msg.from.id + '_' + LanguageForFunktion})
		]
	]);

	bot.deleteMessage(msg.chat.id, msg.message_id);

	let Nachricht = "";
	Nachricht = Nachricht + i18n(LanguageForFunktion, "Start")
	
	if(msg.from.id == config.isSuperAdmin){
		Nachricht = Nachricht + i18n(LanguageForFunktion, "StartAdmin")
    }
    
	msg.reply.text(Nachricht, { parseMode: 'markdown', webPreview: false , replyMarkup})

});

/*----------------------Callback for Buttons--------------------------*/
bot.on('callbackQuery', (msg) => {
	f.log("User: " + msg.from.username + "(" + msg.from.id + ") sended request with data " + msg.data)
	
	if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}

	var data = msg.data.split("_")
	if(parseInt(data[1]) === msg.from.id)
	{
		if(data[0] === 'language')
		{
			bot.answerCallbackQuery(msg.id); //Resolve Button
			let lang = i18n.languages
			let position = lang.indexOf(data[2].toLowerCase())
			position = position + 1;
			if(position > lang.length-1){position = 0}

			let replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton(i18n(lang[position], lang[position]), {callback: 'language_' + msg.from.id + '_' + lang[position]})
				],[
					bot.inlineButton(i18n(lang[position], 'JoinMystagoge'), {callback: 'M_' + msg.from.id + '_' + lang[position]})
				]
			]);

			let Nachricht = "";
			Nachricht = Nachricht + i18n(lang[position], "Start")
		
			if(msg.from.id == config.isSuperAdmin){
				Nachricht = Nachricht + i18n(lang[position], "StartAdmin")
			}

			Nachricht = Nachricht + i18n(lang[position], "StartLanguage")

			bot.editMessageText(
				{chatId: chatId, messageId: messageId}, Nachricht,
				{parseMode: 'markdown', replyMarkup}
			).catch(error => f.Elog('Error (EditMSG):', error.description));

		};
	}else{
		bot.answerCallbackQuery(msg.id,{
			text: "🚫🚫🚫🚫🚫",
			showAlert: false
		});
	}
});