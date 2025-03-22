import {
	Client,
	GatewayIntentBits,
	REST,
	Routes,
	SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import path from "path";
import prompts from "prompts";
import cfonts from "cfonts";
import chalk from "chalk";
import ora from "ora";
import logSymbols from "log-symbols";

const sessionFile = path.join(process.cwd(), "session", "discord.json");

// Fungsi untuk mendapatkan token dan clientId
const getCredentials = async () => {
	let creds = {};

	// Periksa apakah file session ada
	if (fs.existsSync(sessionFile)) {
		try {
			const data = fs.readFileSync(sessionFile, "utf-8");
			creds = JSON.parse(data);

			// Pastikan token dan clientId berupa string dan tidak kosong
			if (
				typeof creds.token === "string" &&
				creds.token.trim() !== "" &&
				typeof creds.clientId === "string" &&
				creds.clientId.trim() !== ""
			) {
				return creds;
			} else {
				console.log(
					logSymbols.warning,
					"Kredensial dalam file tidak valid, meminta ulang...",
				);
			}
		} catch (error) {
			console.log(
				logSymbols.error,
					"Gagal membaca file session. Meminta ulang kredensial...",
			);
		}
	}

	// Minta input ulang
	const response = await prompts([
		{
			type: "text",
			name: "token",
			message: chalk.cyan("Masukkan token bot Discord:"),
			validate: (value) =>
				value.trim() !== "" ? true : "Token tidak boleh kosong!",
		},
		{
			type: "text",
			name: "clientId",
			message: chalk.cyan("Masukkan client ID bot Discord:"),
			validate: (value) =>
				value.trim() !== "" ? true : "Client ID tidak boleh kosong!",
		},
	]);

	// Tampilkan loading setelah input selesai
	const spinner = ora({
		text: chalk.yellow("Mendapatkan kredensial bot..."),
		spinner: "dots",
	}).start();

	// Simpan ke file session
	fs.writeFileSync(sessionFile, JSON.stringify(response, null, 2));
	spinner.succeed(chalk.green("Kredensial bot berhasil didapatkan!"));

	return response;
};

// Menampilkan banner
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

	cfonts.say("Discord", {
		font: "console",
		align: "center",
		colors: ["green"],
	});
}

const main = async () => {
	banner();
	const { token, clientId } = await getCredentials();

	const bot = new Client({ intents: [GatewayIntentBits.Guilds] });

	bot.once("ready", () => {
		console.log(
			logSymbols.success,
			chalk.green(
				`Bot Discord berjalan sebagai ${chalk.cyan(bot.user.tag)}`,
			),
		);
	});

	// Buat perintah slash
	const commands = [
		new SlashCommandBuilder()
			.setName("ping")
			.setDescription("Menampilkan ping bot"),
		new SlashCommandBuilder()
			.setName("hello")
			.setDescription("Bot akan menyapa kamu!"),
	].map((command) => command.toJSON());

	// Daftarkan perintah ke Discord API
	const rest = new REST({ version: "10" }).setToken(token);

	const spinnerCommands = ora({
		text: chalk.yellow("Mengupdate slash commands..."),
		spinner: "dots",
	}).start();

	try {
		await rest.put(Routes.applicationCommands(clientId), {
			body: commands,
		});
		spinnerCommands.succeed(
			chalk.green("Slash commands berhasil diperbarui!"),
		);
	} catch (error) {
		spinnerCommands.fail(chalk.red("Gagal mengupdate commands!"));
		console.error(logSymbols.error, chalk.red(error));
		process.exit(1);
	}

	bot.on("interactionCreate", async (interaction) => {
		if (!interaction.isCommand()) return;

		if (interaction.commandName === "ping") {
			await interaction.reply("🏓 Pong!");
		} else if (interaction.commandName === "hello") {
			await interaction.reply("👋 Halo!");
		}
	});

	const spinnerLogin = ora({
		text: chalk.yellow("Login ke bot Discord..."),
		spinner: "dots",
	}).start();

	try {
		await bot.login(token);
		spinnerLogin.succeed(chalk.green("Bot berhasil login ke Discord!"));
	} catch (error) {
		spinnerLogin.fail(
			chalk.red("Gagal login! Periksa token yang digunakan."),
		);
		console.error(logSymbols.error, chalk.red(error));
		process.exit(1);
	}
};

main();
