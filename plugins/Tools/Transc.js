import { transcribe } from "../../functions/Fall.js";

export default {
	command: ".transc",
	name: "「 TRANSCRIPT 」",
	description: "Transcript video dari YouTube.",
	execute: async (sock, sender, text, msg) => {
		// Gunakan regex untuk mengambil URL setelah perintah
		const urlMatch = text.match(/^\.transc\s+(\S+)/);
		const url = urlMatch ? urlMatch[1] : null;

		try {
			const result = await transcribe(url);
			if (result.status) {
				// Format hasil transcript agar lebih rapi
				let formattedTranscript = result.transcript
					.replace(/\.\s+/g, ".\n\n") // Tambahkan 2 newline setelah titik
					.replace(/,\s+/g, ",\n") // Tambahkan newline setelah koma
					.replace(/\s+/g, " ") // Hapus spasi berlebih
					.trim();

				// Pisahkan setiap paragraf dan kapitalisasi awal kalimat
				formattedTranscript = formattedTranscript
					.split("\n")
					.map(
						(sentence) =>
							sentence.charAt(0).toUpperCase() +
							sentence.slice(1),
					)
					.join("\n");

				if (url.startsWith("https://youtu.be")) {
					await sock.sendMessage(sender, {
						text: "Hannya support domain .be!",
					});
				}

				await sock.sendMessage(sender, {
					text: `📝 *Transcript Video:*\n\n${formattedTranscript}`,
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							mediaType: 1,
							mediaUrl: url,
							title: "「 RESULT TRANSCRIPT 」",
							body: `Video ID: ${result.video_id}`,
							sourceUrl: "",
							thumbnailUrl: "https://cloudkuimages.xyz/uploads/images/67c45f2fd0cc3.jpg",
							renderLargerThumbnail: false,
						},
					},
				});
			} else {
				await sock.sendMessage(sender, {
					text: "❌ *Gagal mengambil transcript.*\nCoba periksa URL atau coba lagi nanti.",
				});
				console.error("Error:", result.msg);
			}
		} catch (error) {
			console.error("Exception:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ *Terjadi kesalahan saat memproses transcript!*",
			});
		}
	},
};
