import { savetube } from "../../functions/Fall.js";

export default {
	command: ".ytmp3",
	name: "「 YOUTUBE MP3 」",
	description: "Download audio YouTube dan mengirimkannya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari args menggunakan regex
			const urlMatch = text.match(/^.ytmp3\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Validasi URL
			if (!url) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Mohon sertakan link YouTube yang valid!",
				});
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil audio...",
			});

			// Gunakan scraper untuk mendapatkan link MP3
			const response = await savetube.download(url, "mp3");

			// Validasi respons scraper
			if (!response?.status || !response?.result?.download) {
				return await sock.sendMessage(sender, {
					text: `⚠️ Gagal mengunduh audio!\n\n❌ *Error:* ${
						response?.error || "Tidak diketahui"
					}`,
				});
			}

			// Ambil detail audio
			const title = response.result.title || "YouTube Audio";
			const audioUrl = response.result.download;
			const thumbnailUrl = response.result.thumbnail;

			// Kirim audio ke pengguna
			await sock.sendMessage(
				sender,
				{
					audio: { url: audioUrl },
					mimetype: "audio/mpeg",
					fileName: `${title}.mp3`,
					caption: `🎵 *YouTube MP3 Download*\n\n📌 *Judul:* ${title}\n🔗 *Link:* ${url}`,
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							title: title,
							body: "YouTube MP3",
							thumbnailUrl: thumbnailUrl,
							renderLargerThumbnail: true,
							mediaType: 1,
							mediaUrl: url,
							sourceUrl: url,
						},
					},
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
