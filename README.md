# CronosCubeMystagoge
A telegram bot that helps you to pick a class in the book Cronos Cube
Ein Telegram Bot der dir hilft, deine Klasse zu finden.

Offizieller Bot: `@Mystagoge_bot`

### Setup

Clone this git
Run `npm install`
Enter Bottoken in secret.json
```json
{
    "bottoken":"You´ll get that from @BotFather"
}
```
Set your fallback/default language and bot admin in config.json
```json
{
	"botname":" Mystagoge",
	"version":"0.0.1",
	"isSuperAdmin":"Admin TG ID",
	"language":"de",
	"fallbacklanguage":"de",
	"WTdelmsgshort":"5400",
	"WTdelmsglong":"25400"
}
```
Now run `npm start`

### Commands
/start - User overview
You can adjust the language there if the automatically selected one doesn't suit you

/alive - Sends botstatus, uptime and response time

### Usage
Answer the questions by clicking the buttons below.
Currently there are 7 questions with 6 choises, In rare cases you will get an eighth question with pre-selected options according to the [rules](https://wintermohn.de/die-weberin/) of the mystagogue
