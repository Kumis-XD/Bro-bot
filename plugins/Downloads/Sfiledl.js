import { sfiledl } from "../../functions/Fall.js";

export default {
	command: ".sfiledl",
	name: "「 SFILE DOWNLOAD 」",
	description: "Sfile downloader.",
	execute: async (sock, sender, text, msg) => {
		const urlMatch = text.match(/^.sfiledl\s+(\S+)/);
		const url = urlMatch ? urlMatch[1] : null;

		if (!url) {
			return await sock.sendMessage(sender, {
				text: `Silahkan masukkan URL Sfile`,
			});
		}

		await sock.reply("⏳ Tunggu sebentar, sedang mengambil file...");

		try {
			const res = await sfiledl.download(url);
			if (res.status !== "success") throw res.message;

			const { filename, filesize, mimeType, result } = res.data;

			await sock.reply(`Nama: ${filename}\nUkuran: ${filesize}`, "doc", {
				url: result.buffer,
				mimetype: "application/zip",
				fileName: filename.replace(/\.[^/.]+$/, "") + ".zip",
				thumbnailUrl: "https://files.catbox.moe/o1e6ny.jpg",
			});
		} catch (err) {
			await sock.react("❌");
		}
	},
};
