import fetch from "node-fetch";

export default {
	command: ".mdl",
	name: "「 MEDIAFIRE DOWNLOAD 」",
	description: "Mengunduh file dari MediaFire melalui API.",
	execute: async (sock, sender, text, msg) => {
		if (!text) {
			return await sock.reply("⚠️ Masukkan URL MediaFire!");
		}

		const apiUrl = `https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(
			text,
		)}`;

		await sock.reply("⏳ Tunggu sebentar, sedang mengambil file...");

		try {
			const response = await fetch(apiUrl);
			const json = await response.json();

			if (!json.status || !json.data) {
				return await sock.sendMessage(
					sender,
					{
						text: "❌ Gagal mendapatkan data! Cek URL yang diberikan.",
					},
					{ quoted: msg },
				);
			}

			const { fileName, downloadLink, fileSize, meta } = json.data;

			let infoText =
				`📂 *Nama File:* ${fileName}\n` +
				`📦 *Ukuran:* ${fileSize}\n` +
				`📄 *Tipe:* ${meta?.type || "Tidak diketahui"}`;

			await sock.sendMessage(sender, { text: infoText }, { quoted: msg });
			await sock.sendMessage(
				sender,
				{
					document: { url: downloadLink },
					mimetype: "application/zip",
					fileName: `${fileName}.zip`,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error fetching MediaFire API:", error);
			await sock.reply("⚠️ Terjadi kesalahan! Coba lagi nanti.")
		}
	},
};
