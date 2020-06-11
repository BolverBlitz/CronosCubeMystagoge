//Include needed jsons
var config = require('./config');
var package = require('./package')
var secret = require('./secret');

//Include some Funktions
const f = require('./src/Funktions');
const OS = require('./src/Hardware');

//Include some modules

const newI18n = require("new-i18n");
const i18n = newI18n(__dirname + "/languages", ["de","en"], config.fallbacklanguage);

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

/**
 * 
 * @param {string} 
 * @returns {object}
 * 
 */

function CountChar(input) {
    const {max, ...counts} = (input || "").split("").reduce(
    (a, c) => {
        a[c] = a[c] ? a[c] + 1 : 1;
        a.max = a.max < a[c] ? a[c] : a.max;
        return a;
    },
    { max: 0 }
    );
    return Object.entries(counts).filter(([k, v]) => v === max);
}

/**
 * 
 * @param {number} num 
 * @returns {number}
 * 
 */

function Round2Dec(num){
    return Math.round(num * 100) / 100
}
/**
 * 
 * @param {object} object 
 * @returns {string}
 * 
 */
function languageDetail(object){
	let OutputString = "";
    for(let property in object){
		OutputString = `${OutputString}\n${i18n(object[property], 'FullLanguageName')} by ${i18n(object[property], 'Author')}`;
	}
	return OutputString;
}

/*---------------------- Telegram Commands --------------------------*/

bot.on(/^\/alive$/i, (msg) => {
	let timediff = Date.now()/1000 - msg.date;
	OS.Hardware.then(function(Hardware) {
		let Output = "";
		Output = Output + '\n- CPU: ' + Hardware.cpubrand + ' ' + Hardware.cpucores + 'x' + Hardware.cpuspeed + ' Ghz';
		Output = Output + '\n- Load: ' + f.Round2Dec(Hardware.load);
		Output = Output + '%\n- Memory Total: ' + f.Round2Dec(Hardware.memorytotal/1073741824) + ' GB'
		Output = Output + '\n- Memory Free: ' + f.Round2Dec(Hardware.memoryfree/1073741824) + ' GB'
			msg.reply.text(`Botname: ${config.botname}\nVersion: ${package.version}\nPing: ${Round2Dec(timediff)}ms\n\nUptime: ${f.uptime(Time_started)}\n\nSystem: ${Output}`).then(function(msg)
			{
				setTimeout(function(){
				bot.deleteMessage(msg.chat.id,msg.message_id).catch(error => f.Elog('Error (deleteMessage):' + error.description));
				}, config.WTdelmsglong);
            });
            bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error (deleteMessage):' + error.description));
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
			bot.inlineButton(i18n(LanguageForFunktion, 'CurrentLang'), {callback: 'language_' + msg.from.id + '_' + LanguageForFunktion})
		],[
			bot.inlineButton(i18n(LanguageForFunktion, 'JoinMystagoge'), {callback: 'M_' + msg.from.id + '_' + LanguageForFunktion})
		]
	]);

	let Nachricht = "";
	Nachricht = Nachricht + i18n(LanguageForFunktion, "Start")
	
	if(msg.from.id == config.isSuperAdmin){
		Nachricht = Nachricht + i18n(LanguageForFunktion, "StartAdmin")
	}
	
	Nachricht = Nachricht + i18n(LanguageForFunktion, "StartLanguage")

	Nachricht = Nachricht + "Verfügbare Sprachen:\n" + languageDetail(i18n.languages)
    
	msg.reply.text(Nachricht, { parseMode: 'markdown', webPreview: false , replyMarkup}).catch(error => f.Elog('Error (/start send MSG):' + error.description));
	bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error (deleteMessage):' + error.description));

});

/*----------------------Callback for Buttons--------------------------
* language_UserID_Langquage is used for chancing the language at start
* M_UserID_Langquage_STRING is used to store the Awnsers in the String
*/
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
					bot.inlineButton(i18n(lang[position], 'CurrentLang'), {callback: 'language_' + msg.from.id + '_' + lang[position]})
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

			Nachricht = Nachricht + "Verfügbare Sprachen:\n" + languageDetail(i18n.languages)

			bot.editMessageText(
				{chatId: chatId, messageId: messageId}, Nachricht,
				{parseMode: 'markdown', replyMarkup}
			).catch(error => f.Elog('Error (EditMSG):' + error.description));

		};

		if(data[0] === 'M')
		{
			bot.answerCallbackQuery(msg.id)
			if(data.length <= 3){
				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton(i18n(data[2], '0A'), {callback: msg.data + "_A"})
					],[
						bot.inlineButton(i18n(data[2], '0B'), {callback: msg.data + "_B"})
					],[
						bot.inlineButton(i18n(data[2], '0C'), {callback: msg.data + "_C"})
					],[
						bot.inlineButton(i18n(data[2], '0D'), {callback: msg.data + "_D"})
					],[
						bot.inlineButton(i18n(data[2], '0E'), {callback: msg.data + "_E"})
					],[
						bot.inlineButton(i18n(data[2], '0F'), {callback: msg.data + "_F"})
					]
				]);
				bot.editMessageText(
					{chatId: chatId, messageId: messageId}, i18n(data[1], '0Frage'),
					{parseMode: 'markdown', replyMarkup}
				).catch(error => f.Elog('Error (EditMSG):' + error.description));
			}else{
				if(i18n(data[2], data[3].length + 'A') !== null){
					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton(i18n(data[2], data[3].length + 'A'), {callback: msg.data + "A"})
						],[
							bot.inlineButton(i18n(data[2], data[3].length + 'B'), {callback: msg.data + "B"})
						],[
							bot.inlineButton(i18n(data[2], data[3].length + 'C'), {callback: msg.data + "C"})
						],[
							bot.inlineButton(i18n(data[2], data[3].length + 'D'), {callback: msg.data + "D"})
						],[
							bot.inlineButton(i18n(data[2], data[3].length + 'E'), {callback: msg.data + "E"})
						],[
							bot.inlineButton(i18n(data[2], data[3].length + 'F'), {callback: msg.data + "F"})
						]
					]);

					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, i18n(data[2], data[3].length + 'Frage'),
						{parseMode: 'markdown', replyMarkup}
					).catch(error => f.Elog('Error (EditMSG):' + error.description));
				}else{
					if(CountChar(data[3]).length > 1){
						let replayKeyboardTEMP = []
						let CharArray = CountChar(data[3])

						for(i=0; i<= CharArray.length-1; i++){
							let object = bot.inlineButton(i18n(data[2], 'Weberin' + CharArray[i][0]), {callback: msg.data + CharArray[i][0]})
							var array = [object]
							replayKeyboardTEMP.push(array)
						}
						
						let replyMarkup = bot.inlineKeyboard(replayKeyboardTEMP)
						let Nachricht = i18n(data[2], 'Weberin')

						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, Nachricht,
							{parseMode: 'markdown', replyMarkup}
						).catch(error => f.Elog('Error (EditMSG):' + error.description));

					}else{

						let res = `http://twitter.com/intent/tweet?text=${encodeURIComponent(i18n(data[2], "Web" + CountChar(data[3])[0][0]))}`

						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton(i18n(data[2], 'WebTwitter'), {url: res})
							]
						]);

						let Nachricht = i18n(data[2], CountChar(data[3])[0][0])
						console.log(res)
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, Nachricht,
							{parseMode: 'markdown', replyMarkup}
						).catch(error => f.Elog('Error (EditMSG):' + error.description));
					}
				}
			}
		}
	}else{
		bot.answerCallbackQuery(msg.id,{
			text: "🚫🚫🚫🚫🚫",
			showAlert: false
		});
	}
});