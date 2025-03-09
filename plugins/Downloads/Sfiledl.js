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

		await sock.sendMessage(sender, { text: "Please Wait..." });

		try {
			const res = await sfiledl.download(url);
			if (res.status !== "success") throw res.message;

			const { filename, filesize, mimeType, result } = res.data;

			await sock.sendMessage(
				sender,
				{
					document: result.buffer,
					mimetype: "application/zip",
					fileName: filename.replace(/\.[^/.]+$/, "") + ".zip",
					caption: `Nama: ${filename}\nUkuran: ${filesize}`,
				},
				{ quoted: msg },
			);
		} catch (err) {
			await sock.sendMessage(sender, {
				text: `Terjadi kesalahan: ${err}`,
			});
		}
	},
};
