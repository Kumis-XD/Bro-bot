import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Menentukan path file konfigurasi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/antilink.json");

// Memuat status AntiLink dari file
export const loadAntilink = () => {
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

// Menyimpan status AntiLink ke file
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
	command: ".antilink",
	name: "「 ANTI LINK 」",
	description:
		"Mengaktifkan atau menonaktifkan pemblokiran link otomatis di grup.",
	execute: async (sock, sender, text, msg) => {
		try {
			const isGroup = msg.key.remoteJid.endsWith("@g.us"); // Cek apakah dalam grup
			if (!isGroup) {
				await sock.sendMessage(sender, {
					text: "⚠️ Perintah ini hanya bisa digunakan dalam grup!",
				});
				return;
			}

			// Ambil informasi grup
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
					text: "⚠️ Bot harus menjadi admin untuk menggunakan fitur ini!",
				});
				return;
			}

			// **Ambil status perintah (on/off)**
			const statusMatch = text.match(/^\.antilink\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			if (!status || (status !== "on" && status !== "off")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Format salah!\nGunakan: *.antilink on* atau *.antilink off*",
				});
				return;
			}

			// **Ambil dan update konfigurasi**
			let config = loadAntilink();

			if (status === "on") {
				if (config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-link sudah aktif di grup ini!",
					});
				} else {
					config[sender] = true;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-link telah diaktifkan! Semua link akan otomatis dihapus.",
					});
				}
			} else if (status === "off") {
				if (!config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-link sudah nonaktif di grup ini!",
					});
				} else {
					config[sender] = false;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-link telah dinonaktifkan!",
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
