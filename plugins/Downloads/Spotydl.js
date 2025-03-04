import axios from "axios";

async function downloadTrack(url) {
    const apiUrl = 'https://spotymate.com/api/download-track';
    const data = {
        url: url
    };
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://spotymate.com/'
    };

    try {
        const response = await axios.post(apiUrl, data, { headers: headers });
        return response.data;
    } catch (error) {
        throw new Error(error.response ? error.response.data : error.message);
    }
}

export default {
	command: ".spotydl",
	name: "「 SPOTIFY DOWNLOAD 」",
	description: "Download lagu dari Spotify dan mengirimkannya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari input
			const urlMatch = text.match(/^.spotydl\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Cek apakah URL valid
			if (!url) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan link Spotify yang valid!",
				});
				return;
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil lagu...",
			});

			// Panggil API untuk mendapatkan data lagu
			const result = await downloadTrack(url);

			// Validasi data respons
			if (!result.file_url) {
				await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengambil lagu! Coba link lain.",
				});
				return;
			}

			// Kirim lagu langsung dari URL
			await sock.sendMessage(
				sender,
				{
					audio: { url: result.file_url },
					mimetype: "audio/mpeg",
					fileName: `brobot.mp3`,
					contextInfo: {
						externalAdReply: {
						  showAdAttribution: true,
							title: "「 RESULT SPOTIFY 」",
							body: '',
							thumbnailUrl: "https://cloudkuimages.xyz/uploads/images/67c45f2fd0cc3.jpg",
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
