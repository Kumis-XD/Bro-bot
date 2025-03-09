import { SFile } from "../../functions/Fall.js";

export default {
	command: ".sfiles",
	name: "「 SFILE SEARCH 」",
	description: "Cari file di Sfile dan ambil informasinya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil query dari argumen
			const queryMatch = text.match(/^\.sfiles\s+(.+)/);
			const query = queryMatch ? queryMatch[1] : null;

			// Validasi input
			if (!query) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Mohon masukkan query Sfile yang ingin dicari!",
				});
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mencari file...",
			});

			// Ambil data dari fungsi `SFile`
			const result = await SFile(query);

			// Validasi hasil
			if (!result || !result.status || result.status === "error") {
				return await sock.sendMessage(sender, {
					text:
						result.message ||
						"❌ Gagal menemukan file. Pastikan URL yang diberikan benar!",
				});
			}

			// Ambil hasil pertama dari pencarian
			const file = result.result[0];

			// Buat teks detail file
			let fileDetails = `*📂 SFILE DOWNLOADER*\n\n`;
			fileDetails += `📌 *Nama File:* ${file.judul}\n`;
			fileDetails += `📏 *Ukuran:* ${file.fileSize || "Tidak diketahui"}\n`;
			fileDetails += `🔗 *Link:* ${file.href}`;

			// Kirim hasil pencarian dengan tampilan interaktif
			await sock.sendMessage(
				sender,
				{
					text: fileDetails,
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							title: file.judul,
							body: "Klik untuk mengunduh",
							thumbnailUrl: "https://files.catbox.moe/nkk59u.jpg",
							renderLargerThumbnail: true,
							mediaType: 1,
							mediaUrl: file.href,
							sourceUrl: file.href,
						},
					},
					footer: "© Padz x Bro Bot",
					mentionedJid: [sender],
					buttons: [
						{
							buttonId: `.sfiledl ${file.href}`,
							buttonText: { displayText: "Download" },
							type: 1,
						},
					],
					headerType: 1,
					viewOnce: true,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
