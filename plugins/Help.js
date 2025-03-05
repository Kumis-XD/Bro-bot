import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Data umum
const botname = process.env.BOT_NAME;
const owner = process.env.OWNER_NAME;

// Konversi import.meta.url ke __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ** Fungsi untuk membaca semua file JS dari folder dan subfolder **
const getPluginFiles = (dir) => {
	let results = [];
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const stats = fs.statSync(filePath);

		if (stats.isDirectory()) {
			// Jika folder, lakukan rekursi
			results = results.concat(getPluginFiles(filePath));
		} else if (stats.isFile() && filePath.endsWith(".js")) {
			results.push(filePath);
		}
	}
	return results;
};

export default {
	command: ".help",
	name: "「 HELPER 」",
	description: "Menampilkan daftar perintah berdasarkan kategori",
	execute: async (sock, sender, text, msg) => {
		const categories = {
			ai: [],
			downloader: [],
			stalker: [],
			group: [],
			search: [],
			owner: [],
			bot: [],
			network: [],
			tools: [],
			other: [],
		};

		// Mendapatkan semua file plugin dari folder `plugins` dan subfoldernya
		const pluginDir = path.join(__dirname, "./");
		const pluginFiles = getPluginFiles(pluginDir); // Menggunakan fungsi rekursif

		const isGroup = sender.endsWith("@g.us");
		const userId = isGroup
			? msg.key.participant.split("@")[0]
			: sender.split("@")[0];

		for (const filePath of pluginFiles) {
			try {
				const { default: plugin } = await import(`file://${filePath}`); // Import dengan absolute path

				if (Array.isArray(plugin)) {
					plugin.forEach((p) =>
						categorizeCommand(p.command, p.name, p.description),
					);
				} else {
					categorizeCommand(
						plugin.command,
						plugin.name,
						plugin.description,
					);
				}
			} catch (error) {
				console.error(
					`❌ Error loading plugin from ${filePath}:`,
					error,
				);
			}
		}

		// Fungsi untuk mengategorikan perintah
		function categorizeCommand(command, name, description) {
			if (
				[".ai", ".llama", ".blackbox", ".mistral", ".joko"].includes(
					command,
				)
			) {
				categories.ai.push({
					id: command,
					title: name,
					description,
				});
			} else if (
				[
					".ttdl",
					".spotydl",
					".pindl",
					".ytdl",
					".igdl",
					".ytmp3",
					".ytmp4",
					".clone",
					".mdl",
					".sfile",
				].includes(command)
			) {
				categories.downloader.push({
					id: command,
					title: name,
					description,
				});
			} else if ([".npm", ".git", ".igs"].includes(command)) {
				categories.stalker.push({
					id: command,
					title: name,
					description,
				});
			} else if (
				[".group", ".tagall", ".antilink", ".antimedia"].includes(
					command,
				)
			) {
				categories.group.push({
					id: command,
					title: name,
					description,
				});
			} else if ([".spotify", ".yts", ".pins"].includes(command)) {
				categories.search.push({
					id: command,
					title: name,
					description,
				});
			} else if (
				[
					"#",
					"=>",
					".clear",
					">",
					".antispam",
					".antimedia",
					".autoai",
					".cek",
					".autosholat",
					".autoread",
					".antiopsi",
					".ctoken",
				].includes(command)
			) {
				categories.owner.push({
					id: command,
					title: name,
					description,
				});
			} else if ([".cek", ".donasi"].includes(command)) {
				categories.bot.push({
					id: command,
					title: name,
					description,
				});
			} else if ([".ping", ".api"].includes(command)) {
				categories.network.push({
					id: command,
					title: name,
					description,
				});
			} else if (
				[".tourl", ".hd", ".rmbg", ".transc", ".brat"].includes(command)
			) {
				categories.tools.push({
					id: command,
					title: name,
					description,
				});
			} else {
				categories.other.push({
					id: command,
					title: name,
					description,
				});
			}
		}

		// Membentuk sections untuk interactive message
		const sections = Object.entries(categories)
			.filter(([, name]) => name.length > 0)
			.map(([category, name]) => ({
				title: `📌 「 ${category.toUpperCase()} 」 Commands`,
				highlight_label: `🚀 「 Padz 」 © ${botname}`,
				rows: name,
			}));

		const now = new Date();

		// Format 24 Jam (HH:MM:SS)
		const hours24 = now.getHours().toString().padStart(2, "0");
		const minutes = now.getMinutes().toString().padStart(2, "0");
		const seconds = now.getSeconds().toString().padStart(2, "0");
		const time24 = `${hours24}:${minutes}:${seconds}`;

		// Format 12 Jam (HH:MM:SS AM/PM)
		const hours12 = (now.getHours() % 12 || 12).toString().padStart(2, "0");
		const ampm = now.getHours() >= 12 ? "PM" : "AM";
		const time12 = `${hours12}:${minutes}:${seconds} ${ampm}`;

		// Waktu di Greenwich (GMT)
		const timeGMT = now.toUTCString().split(" ")[4]; // Mengambil bagian jam dari UTC

		// Waktu Indonesia Barat (WIB) = GMT+7
		const hoursWIB = ((now.getUTCHours() + 7) % 24)
			.toString()
			.padStart(2, "0");
		const timeWIB = `${hoursWIB}:${minutes}:${seconds} WIB`;

		// Gabungkan semua waktu dalam satu object
		const times = {
			time24,
			time12,
			timeGMT,
			timeWIB,
		};

		let ppUrl;
		try {
			ppUrl = await sock.profilePictureUrl(sender, "image");
		} catch (err) {
			ppUrl =
				"https://cloudkuimages.xyz/uploads/images/67c45f2fd0cc3.jpg";
		}

		// Kirim pesan dengan tombol interaktif
		await sock.sendMessage(
			sender,
			{
				image: { url: ppUrl },
				contextInfo: {
					externalAdReply: {
						showAdAttribution: true,
						mediaType: 1,
						mediaUrl:
							"https://cloudkuimages.xyz/uploads/images/67c45f2fd0cc3.jpg",
						title: "「 Padz x Bro Bot 」",
						body: times.timeWIB,
						sourceUrl: "",
						thumbnailUrl:
							"https://files.fotoenhancer.com/uploads/4f3f4c83-2e52-4296-8063-12756c823d05.jpg",
						renderLargerThumbnail: true,
					},
				},
				caption:
					"👋 Halo, Bro! 🤖✨\n\n🚀 Selamat datang di Bro-Bot! 💡\n🔍 Butuh bantuan? Hiburan? Atau fitur canggih? Semuanya ada di sini!\n\n⚡ Cek fitur-fitur keren yang bisa kamu gunakan!\n💬 Jangan ragu buat eksplor!\n\n🎯 Klik tombol di bawah untuk melihat menu! 👇",
				footer: `© ${botname}`,
				mentionedJid: [`${userId}@s.whatsapp.net`],
				buttons: [
					{
						buttonId: ".ping",
						buttonText: { displayText: "📡 Ping" },
						type: 1,
					},
					{
						buttonId: ".donasi",
						buttonText: { displayText: "💰 Donasi" },
						type: 1,
					},
					{
						buttonId: "action",
						buttonText: {
							displayText: "ini pesan interactiveMeta",
						},
						type: 4,
						nativeFlowInfo: {
							name: "single_select",
							paramsJson: JSON.stringify({
								title: "open",
								sections,
							}),
						},
					},
				],
				headerType: 1,
				viewOnce: true,
			},
			{ quoted: msg },
		);
	},
};
