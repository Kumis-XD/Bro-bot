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
				text: "⏳ Tunggu sebentar, sedang mengambil informasi audio...",
			});

			// Ambil data audio dari API eksternal
			const { data: audioData } = await axios.get(
				`https://linecloud.my.id/api/download/ytmp3?url=${url}`,
			);

			// Validasi respons API
			if (!audioData?.status || !audioData?.data?.download) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengunduh audio! Coba link lain.",
				});
			}

			console.log(audioData?.data?.download);

			// Ambil informasi dari API
			const title = audioData.data.title || "Audio";
			const creator = audioData.data.channelTitle || "Tidak diketahui";
			const thumbnail = audioData.data.thumbnails?.high?.url || null;
			const downloadURL = audioData.data.download;

			// Kirim audio ke pengguna
			await sock.sendMessage(
				sender,
				{
					audio: { url: downloadURL },
					mimetype: "audio/mpeg",
					fileName: `${title}.mp3`,
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							title: title,
							body: creator,
							...(thumbnail ? { thumbnailUrl: thumbnail } : {}),
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
