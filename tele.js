import TelegramBot from "node-telegram-bot-api";
import prompts from "prompts";
import fs from "fs";
import path from "path";
import gradient from "gradient-string";
import boxen from "boxen";
import cfonts from "cfonts";
import chalk from "chalk";
import ora from "ora";
import logSymbols from "log-symbols";

// Pastikan folder session dan pluginsTele ada
const sessionFolder = path.join(process.cwd(), "session");
const pluginsFolder = path.join(process.cwd(), "pluginsTele");
const credsFile = path.join(sessionFolder, "creds.json");

if (!fs.existsSync(sessionFolder))
	fs.mkdirSync(sessionFolder, { recursive: true });
if (!fs.existsSync(pluginsFolder))
	fs.mkdirSync(pluginsFolder, { recursive: true });

// Fungsi untuk menghapus folder session jika terjadi error
const deleteSession = () => {
	try {
		if (fs.existsSync(sessionFolder)) {
			fs.rmSync(sessionFolder, { recursive: true, force: true });
			console.log(
				chalk.red(
					`${logSymbols.error} Folder session dihapus karena token error.`,
				),
			);
		}
	} catch (err) {
		console.error(
			chalk.yellow(
				`${logSymbols.warning} Gagal menghapus folder session:`,
			),
			err,
		);
	}
};

// Fungsi untuk menanyakan token jika belum ada
const askQuestion = async (text) => {
	const response = await prompts({
		type: "text",
		name: "answer",
		message: text,
	});
	return response.answer;
};

// Fungsi mendapatkan token dari creds.json atau meminta input jika tidak ada
const getToken = async () => {
	try {
		if (fs.existsSync(credsFile)) {
			const creds = JSON.parse(fs.readFileSync(credsFile, "utf-8"));
			if (creds.token) return creds.token;
		}
	} catch (err) {
		console.error(
			chalk.red(`${logSymbols.error} Error membaca creds.json:`),
			err,
		);
		deleteSession();
	}

	const token = await askQuestion("Masukkan token bot Telegram:");
	if (!token) {
		console.log(chalk.red("Token tidak boleh kosong!"));
		process.exit(1);
	}

	fs.writeFileSync(credsFile, JSON.stringify({ token }, null, 2));
	console.log(
		chalk.green(
			`${logSymbols.success} Token telah disimpan ke session/creds.json`,
		),
	);

	return token;
};

// Memuat plugin ke dalam array
const plugins = [];
const loadPlugins = async () => {
	const spinner = ora("Memuat plugin...").start();
	try {
		const files = fs
			.readdirSync(pluginsFolder)
			.filter((file) => file.endsWith(".js"));

		for (const file of files) {
			const pluginPath = path.join(pluginsFolder, file);
			const { default: plugin } = await import(`file://${pluginPath}`);
			if (plugin.command && typeof plugin.execute === "function") {
				plugins.push(plugin);
				console.log(
					chalk.green(`${logSymbols.success} Plugin ${file} dimuat.`),
				);
			} else {
				console.warn(
					chalk.yellow(
						`${logSymbols.warning} Plugin ${file} tidak memiliki struktur yang valid.`,
					),
				);
			}
		}
		spinner.succeed("Semua plugin telah dimuat.");
	} catch (err) {
		spinner.fail(chalk.red("Gagal memuat plugin!"));
		console.error(err);
	}
};

async function banner() {
	console.clear();
	cfonts.say("BRO-BOT", {
		font: "block",
		align: "center",
		colors: ["cyan", "blue"],
		background: "black",
		letterSpacing: 1,
		lineHeight: 1,
		space: true,
		gradient: ["red", "yellow"],
		independentGradient: true,
		transitionGradient: true,
	});

	cfonts.say("Telegram", {
		font: "console",
		align: "center",
		colors: ["green"],
	});
}

// Fungsi utama
const main = async () => {
	banner();
	const token = await getToken();

	let bot;
	try {
		bot = new TelegramBot(token, { polling: true });
		console.log(
			chalk.green(`${logSymbols.success} Bot Telegram berjalan...`),
		);
	} catch (err) {
		console.error(
			chalk.red(`${logSymbols.error} Error saat menjalankan bot:`),
			err,
		);
		deleteSession();
		process.exit(1);
	}

	await loadPlugins();

	// Menangani event bot.on
	bot.on("message", async (msg) => {
		const pushName = msg.chat.username || msg.chat.first_name || "Pengguna";
		const sender = msg.chat.id;
		const text =
			msg.text || (msg.reply_to_message ? msg.reply_to_message.text : "");

		// Cek apakah pesan mengandung media
		let mediaType = null;
		if (msg.photo) mediaType = "Foto";
		else if (msg.audio) mediaType = "Audio";
		else if (msg.document) mediaType = "Dokumen";
		else if (msg.video) mediaType = "Video";
		else if (msg.voice) mediaType = "Pesan Suara";
		else if (msg.location) mediaType = "Lokasi";
		else if (msg.contact) mediaType = "Kontak";
		else if (msg.sticker) mediaType = "Stiker";

		// Logging pesan
		if (mediaType) {
			const senderStyled = gradient.pastel(`📩 ${pushName}`);
			const textStyled = gradient.summer(`💬 ${mediaType}`);

			const messageBox = boxen(
				`${chalk.bold("📢 PESAN MASUK!")}

${chalk.white("👤 Dari:")} ${senderStyled}
${chalk.white("📷 Mengirim:")} ${textStyled}`,
				{
					padding: 1,
					margin: 1,
					borderStyle: "round",
					borderColor: "cyan",
					backgroundColor: "black",
				},
			);
			console.log(messageBox);
		} else {
			const senderStyled = gradient.pastel(`📩 ${pushName}`);
			const textStyled = gradient.summer(`💬 ${text}`);

			const messageText = boxen(
				`${chalk.bold("📢 PESAN MASUK!")}

${chalk.white("👤 Dari:")} ${senderStyled}
${chalk.white("💬 Pesan:")} ${textStyled}`,
				{
					padding: 1,
					margin: 1,
					borderStyle: "round",
					borderColor: "cyan",
					backgroundColor: "black",
				},
			);
			console.log(messageText);
		}

		// Loop melalui semua plugin dan jalankan yang sesuai
		for (const plugin of plugins) {
			try {
				if (
					(typeof plugin.command === "string" &&
						text.toLowerCase().startsWith(plugin.command)) ||
					text === plugin.command
				) {
					await plugin.execute(bot, sender, text, msg);
				}
			} catch (err) {
				console.error(
					chalk.red(
						`${logSymbols.error} Error di plugin ${plugin.command}:`,
					),
					err,
				);
			}
		}
	});
};

main();
