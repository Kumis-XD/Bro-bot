import {
	makeWASocket,
	useMultiFileAuthState,
	makeInMemoryStore,
	DisconnectReason,
	fetchLatestBaileysVersion,
	downloadContentFromMessage,
	Browsers,
} from "@seaavey/baileys";
import fs from "fs-extra";
import ora from "ora";
import chalk from "chalk";
import path from "path";
import cfonts from "cfonts";
import moment from "moment";
import axios from "axios";
import boxen from "boxen";
import gradient from "gradient-string";
import pino from "pino";
import { Boom } from "@hapi/boom";
import PhoneNumber from "awesome-phonenumber";
import dotenv from "dotenv";
import prompts from "prompts";
import logSymbols from "log-symbols";
import { loadConfig } from "./plugins/Bot/Autoread.js";
import { loadSholat } from "./plugins/Bot/Autosholat.js";
import { loadAntispam } from "./plugins/Bot/Antispam.js";
import { loadAntilink } from "./plugins/Bot/Antilink.js";
import { loadAutoAI } from "./plugins/Bot/Autoai.js";
import { schedulePrayerReminders } from "./functions/Fall.js";
import { loadAntimedia } from "./plugins/Bot/Antimedia.js";
import { checkTokenExpired } from "./functions/Fall.js";

dotenv.config();

const commandUsage = new Map();
const antiConfig = loadAntilink();
const antimedConfig = loadAntimedia();
const store = makeInMemoryStore({
	logger: pino().child({ level: "silent", stream: "store" }),
});

const askQuestion = async (text) => {
	const response = await prompts({
		type: "text",
		name: "answer",
		message: text,
	});
	return response.answer;
};

// Folder untuk menyimpan konfigurasi
const dataDir = path.resolve("./data");

// Pastikan folder ./data ada
async function ensureDataDir() {
	try {
		await fs.mkdir(dataDir, { recursive: true });
	} catch (error) {
		console.error("❌ Gagal membuat folder ./data:", error);
	}
}

async function loadCity() {
	try {
		const filePath = path.join(dataDir, "city.json");
		if (await fs.stat(filePath).catch(() => false)) {
			const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
			return data.city || "Jakarta"; // Default ke Jakarta jika kosong
		}
	} catch (error) {
		console.error("⚠️ Gagal membaca city.json:", error);
	}
	return "Jakarta"; // Default jika gagal
}

async function banner() {
	cfonts.say("BRO-BOT", {
		font: "block", // Gaya teks (pilihan: block, simple, 3d, shade, dll.)
		align: "center", // Posisi teks (left, center, right)
		colors: ["cyan", "blue"], // Warna teks
		background: "black", // Warna latar belakang
		letterSpacing: 1, // Spasi antar huruf
		lineHeight: 1, // Tinggi garis
		space: true, // Menambah spasi di sekitar teks
		gradient: ["red", "yellow"], // Gradasi warna teks
		independentGradient: true, // Gunakan gradasi per huruf
		transitionGradient: true, // Efek transisi warna
	});
}

// Fungsi untuk menyimpan pengaturan ke file JSON
async function saveSetting(filename, key, value) {
	try {
		const filePath = path.join(dataDir, filename);
		let data = {};

		// Jika file sudah ada, baca isi sebelumnya
		try {
			const fileContent = await fs.readFile(filePath, "utf-8");
			data = JSON.parse(fileContent);
		} catch {
			// Jika file belum ada, biarkan data tetap kosong
		}

		// Perbarui nilai berdasarkan key
		data[key] = value;

		// Simpan kembali ke file
		await fs.writeFile(filePath, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error(`❌ Gagal menyimpan ${filename}:`, error);
	}
}

// Fungsi untuk membaca pengaturan dari file JSON
async function loadSetting(filename, key, defaultValue) {
	try {
		const filePath = path.join(dataDir, filename);
		const fileContent = await fs.readFile(filePath, "utf-8");
		const data = JSON.parse(fileContent);
		return data[key] ?? defaultValue;
	} catch {
		return defaultValue;
	}
}

async function startBot() {
	const { state, saveCreds } = await useMultiFileAuthState(
		`${process.env.SESSIONS_PATH}`,
	);

	const plugins = [];
	const pluginDir = "./plugins"; // Folder tempat plugin disimpan

	// Fungsi untuk membaca semua file .js secara rekursif dalam folder dan subfolder
	const loadPlugins = async (dir) => {
		const files = fs.readdirSync(dir);

		for (const file of files) {
			const filePath = path.join(dir, file);
			const stats = fs.statSync(filePath);

			if (stats.isDirectory()) {
				await loadPlugins(filePath);
			} else if (stats.isFile() && filePath.endsWith(".js")) {
				try {
					const pluginPath = path.resolve(filePath);
					const { default: plugin } = await import(pluginPath);

					if (Array.isArray(plugin)) {
						plugins.push(...plugin);
					} else {
						plugins.push(plugin);
					}
				} catch (error) {
					console.error(
						`❌ Error loading plugin from ${filePath}:`,
						error,
					);
				}
			}
		}
	};

	const { version } = await fetchLatestBaileysVersion();

	const sock = makeWASocket({
		version,
		logger: pino({ level: "silent" }),
		printQRInTerminal: false,
		auth: state,
		connectTimeoutMs: 60000,
		defaultQueryTimeoutMs: 0,
		keepAliveIntervalMs: 10000,
		emitOwnEvents: true,
		fireInitQueries: true,
		generateHighQualityLinkPreview: true,
		syncFullHistory: true,
		markOnlineOnConnect: true,
		browser: Browsers.macOS("Chrome"),
	});

	if (!sock.authState.creds.registered) {
		const phoneNumber = await askQuestion(
			"𝙼𝚊𝚜𝚞𝚔𝚊𝚗 𝙽𝚘𝚖𝚎𝚛 𝚈𝚊𝚗𝚐 𝙰𝚔𝚝𝚒𝚏 𝙰𝚠𝚊𝚕𝚒 𝙳𝚎𝚗𝚐𝚊𝚗 𝟼𝟸 : ",
		);
		let code = await sock.requestPairingCode(phoneNumber);
		code = code?.match(/.{1,4}/g)?.join("-") || code;
		console.log(`𝙲𝙾𝙳𝙴 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 : `, code);
	}

	if (store) store.bind(sock.ev);
	sock.public = true;

	sock.downloadMediaMessage = async (message) => {
		let mime = (message.msg || message).mimetype || "";
		let messageType = message.mtype
			? message.mtype.replace(/Message/gi, "")
			: mime.split("/")[0];
		const stream = await downloadContentFromMessage(message, messageType);
		let buffer = Buffer.from([]);
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk]);
		}
		return buffer;
	};

	sock.ev.on("connection.update", (update) => {
		const { connection, lastDisconnect } = update;
		if (connection === "close") {
			let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
			if (
				reason === DisconnectReason.badSession ||
				reason === DisconnectReason.connectionClosed ||
				reason === DisconnectReason.connectionLost ||
				reason === DisconnectReason.connectionReplaced ||
				reason === DisconnectReason.restartRequired ||
				reason === DisconnectReason.timedOut
			) {
				console.log(
					logSymbols.info,
					"Bot disconnect mencoba menghubungkan kembali!",
				);
				startBot();
			} else if (reason === DisconnectReason.loggedOut) {
			} else {
				sock.end(`Unknown DisconnectReason: ${reason}|${connection}`);
			}
		} else if (connection === "open") {
			// Tambahkan spinner dengan ora
			// Panggil fungsi banner
			banner();
			const spinner = ora("Loading plugins...").start();

			loadPlugins(pluginDir)
				.then(() => {
					spinner.succeed(`Total plugins loaded: ${plugins.length}`);
					setTimeout(() => {
						console.log(
							logSymbols.success,
							"Bot terhubung dengan baik!",
						);
					}, 3000); // Jeda 2 detik
				})
				.catch((err) => {
					spinner.fail("Error loading plugins!");
					console.error(err);
					startBot();
				});
		}
	});

	sock.ev.on("creds.update", saveCreds);

	const lastWelcomeTime = new Map(); // Simpan waktu terakhir sambutan owner
	const lastAdminWelcomeTime = new Map(); // Simpan waktu terakhir sambutan admin

	let configSholat = loadSholat();
	let chatId = "120363320183359410@g.us";

	const city = await loadCity(); // Ambil city dari JSON
	console.log("📍 Kota untuk jadwal sholat:", city);

	if (configSholat.autosholat) {
		console.clear();
		schedulePrayerReminders(sock, chatId, city);
	}

	sock.ev.on(
		"group-participants.update",
		async ({ id, participants, action }) => {
			const groupMetadata = await sock.groupMetadata(id); // Ambil metadata grup
			const groupName = groupMetadata.subject; // Nama grup
			const groupOwner = groupMetadata.owner; // Pemilik grup

			if (action === "add") {
				console.log(
					`👥 Anggota baru bergabung: ${participants.join(", ")}`,
				);

				// Kirim sambutan ke grup
				const welcomeMessage =
					`🎉 Selamat datang di grup *${groupName}*!\n\n` +
					`Hai, ${participants.join(", ")}! 🎉\n` +
					`Jangan lupa untuk membaca aturan grup dan tetap menjaga kenyamanan bersama! 😊\n\n` +
					`Pemilik grup: @${groupOwner.split("@")[0]}`;

				// Mengirim sambutan ke grup
				await sock.sendMessage(id, {
					text: welcomeMessage,
					contextInfo: {
						mentionedJid: participants.map(
							(participant) => `${participant}@s.whatsapp.net`,
						), // Menyebut anggota yang baru bergabung
					},
				});
			} else if (action === "remove") {
				console.log(`🚪 Anggota keluar: ${participants.join(", ")}`);

				// Kirim pesan pemberitahuan jika anggota keluar
				const farewellMessage =
					`😢 *${participants.join(
						", ",
					)}* telah keluar dari grup *${groupName}*.\n` +
					`Semoga harimu menyenankan! ✨`;

				await sock.sendMessage(id, {
					text: farewellMessage,
				});
			}
		},
	);

	sock.ev.on("call", async (call) => {
		console.log("📞 Panggilan masuk:", call);

		// Auto-reject panggilan
		for (const c of call) {
			await sock.rejectCall(c.id, c.from);
			console.log("❌ Panggilan ditolak:", c.from);
		}
	});

	sock.ev.on(
		"messaging-history.set",
		({ chats, contacts, messages, isLatest }) => {
			console.log("📜 Riwayat pesan:", messages);
			console.log("📱 Kontak baru:", contacts);
			console.log("💬 Chat baru:", chats);
			console.log("🆕 Is Latest:", isLatest);
		},
	);

	sock.ev.on("messages.upsert", async (m) => {
		const msg = m.messages[0];
		if (!msg.message || !msg.key.remoteJid) return;
		let config = loadConfig();
		let configai = loadAutoAI();
		if (config.autoread) {
			await sock.readMessages([msg.key]);
		}

		const sender = msg.key.remoteJid;
		const isGroup = sender.endsWith("@g.us");
		const participantId = msg.key.participant || sender; // Jika private chat, gunakan sender langsung
		const senderNumber = participantId.split("@")[0]; // Nomor pengirim
		const now = Date.now();
		await sock.sendPresenceUpdate("composing", sender);

		// **Ambil daftar admin jika pesan dari grup**
		let groupAdmins = [];
		let pushnameAdmin = "Admin";
		if (sender.includes("@g.us")) {
			const groupMetadata = await sock.groupMetadata(sender);
			groupAdmins = groupMetadata.participants
				.filter((member) => member.admin !== null)
				.map((admin) => admin.id);

			// **Cek apakah pengirim adalah admin dan dapatkan pushname**
			const adminData = groupMetadata.participants.find(
				(member) =>
					member.id === participantId && member.admin !== null,
			);
			if (adminData) {
				pushnameAdmin = adminData.name || "Admin Tanpa Nama";
			}
		}

		// **Pesan sambutan untuk owner**
		const OWNER_NUMBER = process.env.OWNER_NUMBER
			? process.env.OWNER_NUMBER.split(",").map((num) => num.trim())
			: [];
		const OWNER_NAME = process.env.OWNER_NAME || "Padz";
		const OWNER_NUMBERS =
			OWNER_NUMBER.length > 0 ? OWNER_NUMBER[0] : "6285867760406"; // Default jika tidak ada di .env
		const OWNER_VCARD = `BEGIN:VCARD
VERSION:3.0
FN:${OWNER_NAME}
TEL;type=CELL;waid=${OWNER_NUMBERS}:${OWNER_NUMBERS}
END:VCARD`;

		const quotedVCard = {
			key: {
				remoteJid: sender,
				fromMe: false,
				participant: "13135550002@s.whatsapp.net",
			},
			message: {
				contactMessage: {
					displayName: OWNER_NAME,
					vcard: OWNER_VCARD,
				},
			},
		};
		const lastTime = lastWelcomeTime.get(sender) || 0;
		const timeDiff = now - lastTime;

		if (sender.includes("@g.us") && OWNER_NUMBER.includes(senderNumber)) {
			if (timeDiff >= 30 * 60 * 1000) {
				await sock.sendMessage(
					sender,
					{
						text: "👑 *Owner Terdeteksi!* 👑\n\nSelamat datang kembali, ownerku.",
					},
					{ quoted: quotedVCard },
				);
				lastWelcomeTime.set(sender, now);
			}
		}

		// **Pesan sambutan untuk admin**
		const lastAdminTime = lastAdminWelcomeTime.get(sender) || 0;
		const adminTimeDiff = now - lastAdminTime;

		const ADMIN_VCARD = `BEGIN:VCARD
VERSION:3.0
FN:${pushnameAdmin}
TEL;type=CELL;waid=${senderNumber}:${senderNumber}
END:VCARD`;

		const quotedVCardAdmin = {
			key: {
				remoteJid: sender,
				fromMe: false,
				participant: participantId,
			},
			message: {
				contactMessage: {
					displayName: pushnameAdmin,
					vcard: ADMIN_VCARD,
				},
			},
		};

		if (
			sender.includes("@g.us") &&
			groupAdmins.includes(participantId) &&
			adminTimeDiff >= 30 * 60 * 1000
		) {
			await sock.sendMessage(
				sender,
				{
					text: `🔹 *Admin Terdeteksi!* 🔹\n\n📢 Selamat datang kembali *@${senderNumber}* di grup! 🎉`,
					mentions: [participantId],
				},
				{ quoted: quotedVCardAdmin },
			);
			lastAdminWelcomeTime.set(sender, now);
		}

		let parsedParams = {};
		try {
			const paramsJson =
				msg.message?.interactiveResponseMessage
					?.nativeFlowResponseMessage?.paramsJson;

			if (typeof paramsJson === "string" && paramsJson.trim() !== "") {
				parsedParams = JSON.parse(paramsJson);
			} else {
				console.log(paramsJson);
			}
		} catch (error) {
			console.error("❌ Error parsing JSON:", error);
		}

		const text =
			msg.message?.conversation ||
			msg.message?.imageMessage?.mimetype ||
			msg.message?.audioMessage?.mimetype ||
			msg.message?.videoMessage?.mimetype ||
			msg.message?.documentMessage?.mimetype ||
			msg.message?.extendedTextMessage?.text ||
			parsedParams.id ||
			msg.message?.templateButtonReplyMessage?.selectedId ||
			msg.message?.buttonsResponseMessage?.selectedButtonId ||
			msg.message?.interactiveResponseMessage
				?.nativeFlowResponseMessage || // Gunakan hasil parse yang aman
			"";
		const quotd =
			msg.message?.imageMessage ||
			msg.message?.documentMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.imageMessage ||
			msg.message?.audioMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.audioMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.documentMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.videoMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.conversation ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.extendedTextMessage?.text ||
			msg.message?.templateButtonReplyMessage?.selectedId ||
			msg.message?.buttonsResponseMessage?.selectedButtonId ||
			msg.message?.interactiveResponseMessage
				?.nativeFlowResponseMessage ||
			"";
		let cmd =
			msg.message?.templateButtonReplyMessage?.selectedId ||
			msg.message?.buttonsResponseMessage?.selectedButtonId ||
			msg.message?.interactiveResponseMessage
				?.nativeFlowResponseMessage ||
			"";

		// Fungsi untuk mendeteksi link di dalam pesan
		const containsLink = (text) => {
			const urlRegex = /(https?:\/\/[^\s]+)/g;
			return urlRegex.test(text);
		};

		// Regex untuk memeriksa jenis media
		const isMediaMessage = /image|video|audio|application|document/.test(
			text,
		);

		const result = sender.includes("@g.us")
			? msg.key.participant.split("@")[0]
			: sender.split("@")[0] === process.env.OWNER_NUMBER
			? { expired: false }
			: checkTokenExpired(
					sender.includes("@g.us")
						? msg.key.participant.split("@")[0]
						: sender.split("@")[0],
			  );

		// Fungsi untuk memeriksa apakah pengirim adalah admin atau owner
		const isAdminOrOwner = (sender, groupMembers) => {
			// Cek apakah pengirim adalah admin atau owner
			return groupMembers.some(
				(member) =>
					member.id === sender && (member.admin || member.isOwner),
			);
		};

		const userId = isGroup
			? msg.key.participant.split("@")[0]
			: sender.split("@")[0];

		// Jika media terdeteksi
		if (isMediaMessage) {
			console.log("Media terdeteksi: " + text);
			if (
				msg.key.fromMe ||
				sender.includes("@broadcast") ||
				sender.includes("@newsletter")
			)
				return;

			if (isGroup && antimedConfig.antimedia) {
				let groupMetadata = null;
				let groupMembers = [];
				let botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
				const groupAdmins = groupMembers
					.filter((member) => member.admin)
					.map((member) => member.id);
				const isBotAdmin = groupAdmins.includes(botNumber);
				if (!isBotAdmin) {
					return;
				}

				if (isGroup) {
					groupMetadata = await sock.groupMetadata(msg.key.remoteJid); // Ambil metadata grup
					groupMembers = groupMetadata.participants || []; // Ambil daftar anggota grup
				}

				const participantId = msg.key.participant || sender;
				const senderNumber = participantId.split("@")[0];

				if (
					isGroup &&
					isAdminOrOwner(
						senderNumber + "@s.whatsapp.net",
						groupMembers,
					)
				) {
					return; // Jika pengirim adalah admin atau owner, jangan hapus pesan
				}

				// Mengirim notifikasi
				await sock.sendMessage(sender, {
					text: "⚠️ Media terdeteksi dan telah dihapus karena fitur Anti-Media aktif.",
				});

				// Menghapus pesan yang mengandung media
				await sock.sendMessage(sender, { delete: msg.key });
				return; // Stop eksekusi lebih lanjut
			}
		}

		if (antiConfig.antilink && containsLink(text) && isGroup) {
			// Ambil informasi grup jika pengirim dari grup
			let groupMetadata = null;
			let groupMembers = [];
			if (
				msg.key.fromMe ||
				sender.includes("@broadcast") ||
				sender.includes("@newsletter")
			)
				return;

			if (isGroup) {
				groupMetadata = await sock.groupMetadata(msg.key.remoteJid); // Ambil metadata grup
				groupMembers = groupMetadata.participants || []; // Ambil daftar anggota grup
			}

			// Cek apakah pengirim adalah admin atau owner
			const participantId = msg.key.participant || sender;
			const senderNumber = participantId.split("@")[0]; // Nomor pengirim
			if (
				isGroup &&
				isAdminOrOwner(senderNumber + "@s.whatsapp.net", groupMembers)
			) {
				// Jika pengirim adalah admin atau owner, jangan hapus pesan
				return;
			}

			await sock.sendMessage(sender, {
				text: "⚠️ Link terdeteksi dan telah dihapus karena fitur Anti-Link aktif.",
			});
			await sock.sendMessage(sender, { delete: msg.key }); // Menghapus pesan yang mengandung link
			return; // Stop eksekusi lebih lanjut
		}

		if (configai.autoai) {
			if (msg.key.fromMe) return;
			try {
				const { data } = await axios.get(
					`https://api.diioffc.web.id/api/ai/mora?query=${encodeURIComponent(
						text,
					)}&username=${msg.pushName}`,
				);

				if (data.status) {
					let res = data.result.message
						.replace(/\*\*(.*?)\*\*/g, "$1") // Hapus tanda ** di sekitar teks
						.replace(/###/g, " ") // Ganti ### dengan spasi
						.trim();

					await sock.sendMessage(
						sender,
						{ text: res },
						{ quoted: msg },
					);
				} else {
					await sock.sendMessage(sender, {
						text: "⚠️ Tidak ada respons dari AI.",
					});
				}
			} catch (error) {
				console.error("❌ Error saat menghubungi API:", error);
			}
		}

		// Gradien warna teks
		const senderStyled = gradient.pastel(`📩 ${sender}`);
		const textStyled = gradient.summer(`💬 ${text}`);

		// Kotak dengan border keren
		const messageBox = boxen(
			`${chalk.bold("📢 PESAN MASUK!")}

${chalk.white("👤 Dari:")} ${senderStyled}
${chalk.white("✉️ Pesan:")} ${textStyled}`,
			{
				padding: 1,
				margin: 1,
				borderStyle: "round",
				borderColor: "cyan",
				backgroundColor: "black",
			},
		);

		console.log(messageBox);

		// **Cek dan jalankan plugin jika cocok**
		for (const plugin of plugins) {
			try {
				// Cek apakah perintah cocok dengan plugin
				if (
					(typeof plugin.command === "string" &&
						text.toLowerCase().startsWith(plugin.command)) ||
					cmd == plugin.command ||
					parsedParams == plugin.command
				) {
					if (result.expired) {
						await sock.sendMessage(sender, {
							text: `⚠️ ${result.message}`,
						});
						return;
					}
					// Load status AntiSpam
					const config = loadAntispam();

					// Jika AntiSpam aktif, lakukan pengecekan batasan command
					if (config.antispam) {
						if (
							msg.key.fromMe &&
							sender.includes("@broadcast") &&
							sender.includes("@newsletter")
						)
							return;
						const userUsage = commandUsage.get(sender) || {
							count: 0,
							time: Date.now(),
						};

						// Reset counter jika sudah lebih dari 1 menit
						if (Date.now() - userUsage.time > 60000) {
							userUsage.count = 0;
							userUsage.time = Date.now();
						}

						// Jika pengguna sudah melebihi batas (5 kali dalam 1 menit)
						if (userUsage.count >= 5) {
							await sock.sendMessage(sender, {
								text: "🚫 Kamu sudah mencapai batas penggunaan command (5 kali per menit). Tunggu sebentar!",
							});
							continue; // Lewati eksekusi plugin
						}

						// Tambah hitungan penggunaan command
						userUsage.count += 1;
						commandUsage.set(sender, userUsage);
					}

					// Jika tidak ada pembatasan atau belum mencapai limit, eksekusi command
					await plugin.execute(sock, sender, text, msg, quotd);
				}
			} catch (err) {
				console.error(`❌ Error di plugin ${plugin.command}:`, err);
			}
		}
	});
}

async function botSetting() {
	await ensureDataDir();

	console.clear(); // Bersihkan terminal sebelum memulai
	// Panggil fungsi banner
	banner();
	console.log("\n⚙️  Welcome to Bro-Bot Settings ⚙️\n");

	// Opsi skip untuk langsung gunakan pengaturan default
	const { skip } = await prompts({
		type: "toggle",
		name: "skip",
		message: "⏩ Skip pengaturan dan gunakan default?",
		initial: false,
		active: "YA",
		inactive: "TIDAK",
	});

	if (skip) {
		console.clear();
		// Panggil fungsi banner
		banner();
		console.log(
			"⏩ Menggunakan pengaturan default dan menjalankan bot...\n",
		);

		// Set semua nilai ke default
		await Promise.all([
			saveSetting("city.json", "city", "Jakarta"),
			saveSetting("autoai.json", "autoai", false),
			saveSetting("autoread.json", "autoread", false),
			saveSetting("autosholat.json", "autosholat", false),
			saveSetting("antimedia.json", "antimedia", false),
			saveSetting("antilink.json", "antilink", false),
			saveSetting("antispam.json", "antispam", false),
		]);

		return startBot(); // Jalankan bot setelah skip
	}

	// Jika tidak skip, lanjut ke konfigurasi normal
	const responses = await prompts([
		{
			type: "text",
			name: "city",
			message: "🌍 Masukkan nama kota untuk fitur lokasi:",
			initial: await loadSetting("city.json", "city", "Banyumas"),
			onRender() {
				console.clear();
				// Panggil fungsi banner
				banner();
			}, // Bersihkan terminal sebelum tampil
		},
		{
			type: "toggle",
			name: "autoai",
			message: "🤖 Aktifkan fitur AutoAI?",
			initial: await loadSetting("autoai.json", "autoai", false),
			active: "YES",
			inactive: "NO",
			onRender() {
				console.clear();
				// Panggil fungsi banner
				banner();
			},
		},
		{
			type: "toggle",
			name: "autoread",
			message: "📩 Aktifkan fitur AutoRead?",
			initial: await loadSetting("autoread.json", "autoread", true),
			active: "YES",
			inactive: "NO",
			onRender() {
				console.clear();
				// Panggil fungsi banner
				banner();
			},
		},
		{
			type: "toggle",
			name: "autosholat",
			message: "🕌 Aktifkan fitur AutoSholat?",
			initial: await loadSetting("autosholat.json", "autosholat", true),
			active: "YES",
			inactive: "NO",
			onRender() {
				console.clear();
				// Panggil fungsi banner
				banner();
			},
		},
		{
			type: "toggle",
			name: "antimedia",
			message: "📵 Aktifkan fitur AntiMedia?",
			initial: await loadSetting("antimedia.json", "antimedia", true),
			active: "YES",
			inactive: "NO",
			onRender() {
				console.clear();
				// Panggil fungsi banner
				banner();
			},
		},
		{
			type: "toggle",
			name: "antilink",
			message: "🔗 Aktifkan fitur AntiLink?",
			initial: await loadSetting("antilink.json", "antilink", true),
			active: "YES",
			inactive: "NO",
			onRender() {
				console.clear();
				// Panggil fungsi banner
				banner();
			},
		},
		{
			type: "toggle",
			name: "antispam",
			message: "🚫 Aktifkan fitur AntiSpam?",
			initial: await loadSetting("antispam.json", "antispam", true),
			active: "YES",
			inactive: "NO",
			onRender() {
				console.clear();
				// Panggil fungsi banner
				banner();
			},
		},
	]);

	console.clear();
	// Panggil fungsi banner
	banner();
	console.log("\n✅ Semua pengaturan berhasil diperbarui!\n");

	// Simpan hasil konfigurasi ke file masing-masing
	await Promise.all([
		saveSetting("city.json", "city", responses.city),
		saveSetting("autoai.json", "autoai", responses.autoai),
		saveSetting("autoread.json", "autoread", responses.autoread),
		saveSetting("autosholat.json", "autosholat", responses.autosholat),
		saveSetting("antimedia.json", "antimedia", responses.antimedia),
		saveSetting("antilink.json", "antilink", responses.antilink),
		saveSetting("antispam.json", "antispam", responses.antispam),
	]);

	startBot().catch((err) => console.error("❌ Error:", err));
}

botSetting().catch((err) => console.error("❌ Error:", err));
