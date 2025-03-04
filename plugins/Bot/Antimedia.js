import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Menentukan path file konfigurasi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/antimedia.json");

// Memuat status Anti-Media dari file
export const loadAntimedia = () => {
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

// Menyimpan status Anti-Media ke file
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
	command: ".antimedia",
	name: "「 ANTI MEDIA 」",
	description:
		"Mengaktifkan atau menonaktifkan pemblokiran media otomatis dalam grup.",
	execute: async (sock, sender, text, msg) => {
		try {
			// **Cek apakah dalam grup**
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

			// **Cek apakah bot adalah admin**
			const isBotAdmin = groupAdmins.includes(botNumber);
			if (!isBotAdmin) {
				await sock.sendMessage(sender, {
					text: "⚠️ Bot harus menjadi admin agar bisa menghapus media secara otomatis!",
				});
			}

			// **Ambil status perintah (on/off)**
			const statusMatch = text.match(/^\.antimedia\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			if (!status || (status !== "on" && status !== "off")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Format salah!\nGunakan: *.antimedia on* atau *.antimedia off*",
				});
				return;
			}

			// **Ambil dan update konfigurasi**
			let config = loadAntimedia();

			if (status === "on") {
				if (config["antimedia"]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-media sudah aktif di grup ini!",
					});
				} else {
					config["antimedia"] = true;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-media telah diaktifkan! Semua media akan otomatis dihapus.",
					});
				}
			} else if (status === "off") {
				if (!config["antimedia"]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-media sudah nonaktif di grup ini!",
					});
				} else {
					delete config["antimedia"];
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-media telah dinonaktifkan!",
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
