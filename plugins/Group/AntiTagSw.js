import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Menentukan path file konfigurasi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/antitagsw.json");

// Memuat status Anti-Tag SW dari file
export const loadAntiTagSW = () => {
	try {
		if (!fs.existsSync(CONFIG_FILE)) {
			saveConfig({});
		}
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
	} catch (error) {
		console.error("❌ Error saat memuat konfigurasi:", error);
		return {};
	}
};

// Menyimpan status Anti-Tag SW ke file
export const saveConfig = (config) => {
	try {
		const dir = path.dirname(CONFIG_FILE);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error("❌ Error saat menyimpan konfigurasi:", error);
	}
};

export default {
	command: ".antitagsw",
	name: "「 ANTI TAG SW 」",
	description:
		"Mengaktifkan atau menonaktifkan fitur anti-tag grup di status WhatsApp.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Cek apakah dalam grup
			const isGroup = msg.key.remoteJid.endsWith("@g.us");
			if (!isGroup) {
				await sock.sendMessage(sender, {
					text: "⚠️ Perintah ini hanya bisa digunakan dalam grup!",
				});
				return;
			}

			// Ambil metadata grup
			const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
			const groupMembers = groupMetadata.participants || [];
			const groupAdmins = groupMembers
				.filter((member) => member.admin)
				.map((member) => member.id);
			const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

			// Cek apakah bot adalah admin
			const isBotAdmin = groupAdmins.includes(botNumber);
			if (!isBotAdmin) {
				await sock.sendMessage(sender, {
					text: "⚠️ Bot harus menjadi admin agar bisa menghapus pesan otomatis!",
				});
			}

			// Ambil status perintah (on/off)
			const statusMatch = text.match(/^\.antitagsw\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			if (!status || (status !== "on" && status !== "off")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Format salah!\nGunakan: *.antitagsw on* atau *.antitagsw off*",
				});
				return;
			}

			// Ambil dan update konfigurasi
			let config = loadAntiTagSW();

			if (status === "on") {
				if (config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-Tag SW sudah aktif di grup ini!",
					});
				} else {
					config[sender] = true;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-Tag SW telah diaktifkan! Pengguna yang menandai grup di status akan dikeluarkan.",
					});
				}
			} else if (status === "off") {
				if (!config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-Tag SW sudah nonaktif di grup ini!",
					});
				} else {
					config[sender] = false;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-Tag SW telah dinonaktifkan!",
					});
				}
			}
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
