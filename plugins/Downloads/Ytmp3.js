import axios from "axios";

export default {
	command: ".ytmp3",
	name: "「 YOUTUBE MP3 」",
	description: "Download audio YouTube dan mengirimkannya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari args
			const urlMatch = text.match(/^.ytmp3\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Validasi URL
			if (!url || !url.startsWith("http")) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon sertakan link YouTube yang valid!",
				});
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil audio...",
			});

			// Ambil data audio dari API eksternal
			const { data: audioData } = await axios.get(
				`https://api.siputzx.my.id/api/dl/youtube/mp3?url=${url}`,
			);

			// Validasi respons API
			if (!audioData?.status || !audioData?.data) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengunduh audio! Coba link lain.",
				});
			}

			// Ambil informasi dari API
			const download = audioData.data;
			console.log("🔗 Link Download:", download);

			// Kirim audio ke pengguna
			await sock.sendMessage(
				sender,
				{
					audio: { url: download },
					mimetype: "audio/mpeg",
					fileName: "YouTube_Audio.mp3",
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error:", error?.message || error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
