import axios from "axios";

export default {
	command: ".ytmp4",
	name: "「 YOUTUBE MP4 」",
	description: "Mendapatkan informasi video YouTube dan mengunduhnya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari args
			const urlMatch = text.match(/^.ytmp4\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Validasi URL
			if (!url || !url.startsWith("http")) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Mohon sertakan link YouTube yang valid!",
				});
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil informasi video...",
			});

			// Ambil data video dari API eksternal
			const { data: response } = await axios.get(
				`https://restapi-v2.simplebot.my.id/download/ytdl?url=${encodeURIComponent(
					url,
				)}`,
			);

			// Validasi respons dari API
			if (!response?.status || !response?.result?.mp4) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mendapatkan video! Coba link lain.",
				});
			}

			// Ambil detail video dari response API
			const videoData = response.result;
			const title = videoData.title || "Video YouTube";
			const videoUrl = videoData.mp4;

			// Kirim informasi video ke pengguna
			const caption =
				`🎬 *Informasi Video YouTube*\n\n` +
				`📌 *Judul:* ${title}\n` +
				`🔗 *Link Asli:* ${url}\n`;

			await sock.sendMessage(
				sender,
				{
					video: { url: videoUrl },
					mimetype: "video/mp4",
					caption: caption,
					fileName: `${title}.mp4`,
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
