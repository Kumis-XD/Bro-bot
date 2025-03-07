import axios from "axios";

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
			if (!url || !url.startsWith("http")) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Mohon sertakan link YouTube yang valid!",
				});
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil audio...",
			});

			// Ambil data audio dari API eksternal
			const { data: response } = await axios.get(
				`https://restapi-v2.simplebot.my.id/download/ytdl?url=${encodeURIComponent(
					url,
				)}`,
			);

			// Validasi respons API
			if (!response?.status || !response?.result?.mp3) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengunduh audio! Coba link lain.",
				});
			}

			// Ambil detail audio dari response API
			const audioData = response.result;
			const title = audioData.title || "YouTube Audio";
			const audioUrl = audioData.mp3;

			// Kirim audio ke pengguna
			await sock.sendMessage(
				sender,
				{
					audio: { url: audioUrl },
					mimetype: "audio/mpeg",
					fileName: `${title}.mp3`,
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
