import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionPath = path.resolve(__dirname, "../../whatsapp/");

export default {
	command: ".clear",
	name: "「 SESSIONS CLEANER 」",
	description: "Menghapus semua file session kecuali creds.json",
	execute: async (sock, sender) => {

		try {
			// Pastikan folder session ada
			if (!fs.existsSync(sessionPath)) {
				return sock.sendMessage(sender, {
					text: "⚠️ Folder sessions tidak ditemukan!",
				});
			}

			// Baca semua file dalam folder sessions
			const files = fs.readdirSync(sessionPath);

			// Hapus semua file JSON kecuali creds.json
			let deletedFiles = 0;
			for (const file of files) {
				if (file !== "creds.json" && file.endsWith(".json")) {
					fs.unlinkSync(path.join(sessionPath, file));
					deletedFiles++;
				}
			}

			await sock.sendMessage(sender, {
				text: `✅ Berhasil menghapus ${deletedFiles} file session!`,
			});
		} catch (error) {
			console.error("❌ Error saat menghapus session:", error);
			sock.sendMessage(sender, {
				text: "❌ Terjadi kesalahan saat menghapus session!",
			});
		}
	},
};
