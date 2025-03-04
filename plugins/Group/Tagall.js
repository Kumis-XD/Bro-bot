export default {
	command: ".tagall",
	name: "「 TAG ALL 」",
	description: "Mention semua anggota grup.",
	execute: async (sock, sender, text, msg) => {
		try {
			let groupId = sender.includes("@g.us");
			const teksMatch = text.match(/^.tagall\s+(\S+)/);
			const teks = teksMatch ? teksMatch[1] : null;
			// Cek apakah perintah dijalankan dalam grup
			if (!groupId) {
				await sock.sendMessage(sender, {
					text: "⚠️ Perintah ini hanya bisa digunakan dalam grup!",
				});
				return;
			}

			// Ambil metadata grup
			const groupMetadata = await sock.groupMetadata(sender);
			if (!groupMetadata) {
				await sock.sendMessage(sender, {
					text: "⚠️ Gagal mendapatkan metadata grup.",
				});
				return;
			}

			// Ambil daftar anggota grup
			const participants = groupMetadata.participants;
			if (!participants || participants.length === 0) {
				await sock.sendMessage(sender, {
					text: "⚠️ Tidak ada anggota dalam grup.",
				});
				return;
			}

			// Buat teks mention untuk semua anggota
			let mentionText;
			if (!teks) {
				mentionText =
					`👥 *Tag All*\n\n` +
					participants.map((p) => `@${p.id.split("@")[0]}`).join("\n");
			} else {
				mentionText =
					`👥 *Tag All*\n\nPesan ( ${teks} )\n\n` +
					participants.map((p) => `@${p.id.split("@")[0]}`).join("\n");
			}

			// Kirim pesan dengan mention semua anggota
			await sock.sendMessage(
				sender,
				{
					text: mentionText,
					mentions: participants.map((p) => p.id),
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
