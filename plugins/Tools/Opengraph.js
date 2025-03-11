import ogs from "open-graph-scraper";
import fetch from "node-fetch";
import fs from "fs";
import { exec } from "child_process";
import path from "path";

export default {
	command: ".get",
	name: "「 OPENGRAPH SCRAPER 」",
	description: "Mendapatkan data OpenGraph dari sebuah URL.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Parsing perintah untuk menentukan metode
			const apiMatch = text.match(
				/^\.get\s+(header|result|html)\s+(\S+)/i,
			);
			if (!apiMatch) {
				return sock.sendMessage(sender, {
					text:
						"⚠️ Format salah! Gunakan:\n" +
						"📌 *.get header <url>* → Fetch response header.\n" +
						"📌 *.get result <url>* → Fetch OpenGraph metadata.\n" +
						"📌 *.get html <url>* → Fetch response HTML.",
				});
			}

			const method = apiMatch[1]; // "header", "result", atau "html"
			const url = apiMatch[2];

			let message = "";
			if (method === "header") {
				// Fetch Header Response
				const response = await fetch(url);
				const headers = Object.fromEntries(response.headers.entries());

				message = `📡 *Response Headers:*\n`;
				message += `🔗 *URL:* ${response.url}\n`;
				message += `📄 *Status:* ${response.status} ${response.statusText}\n\n`;
				message += `🛠 *Headers:*\n`;

				for (const [key, value] of Object.entries(headers)) {
					message += `• *${key}*: ${value}\n`;
				}
			} else if (method === "result") {
				// OpenGraph Scraper
				const { error, result } = await ogs({ url });
				if (error) {
					return sock.sendMessage(sender, {
						text: `❌ Gagal mengambil OpenGraph dari URL: ${url}`,
					});
				}

				const title = result.ogTitle || "Tidak ada judul";
				const description =
					result.ogDescription || "Tidak ada deskripsi";
				let image =
					result.ogImage?.url ||
					"https://files.catbox.moe/aw1zie.jpg";
				const siteUrl = result.ogUrl || url;

				// Cek apakah gambar SVG
				if (image.endsWith(".svg")) {
					image = await convertSvgToJpg(image);
				}

				message = `📌 *OpenGraph Metadata*\n`;
				message += `📜 *Judul:* ${title}\n`;
				message += `📝 *Deskripsi:* ${description}\n`;
				message += `🔗 *URL:* ${siteUrl}\n`;

				// Kirim pesan dengan gambar thumbnail
				await sock.sendMessage(
					sender,
					{
						image: { url: image },
						caption: message,
					},
					{ quoted: msg },
				);
				return;
			} else if (method === "html") {
				// Fetch HTML Page
				const response = await fetch(url);
				const html = await response.text();

				// Batasi panjang HTML untuk menghindari pesan yang terlalu panjang
				message = `📝 *HTML Preview*:\n\`\`\`${html}\`\`\``;
			}

			// Kirim hasil ke pengguna
			await sock.sendMessage(sender, { text: message }, { quoted: msg });
		} catch (error) {
			console.error("❌ API Error:", error.message);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan saat mengakses API.",
			});
		}
	},
};

async function convertSvgToJpg(svgUrl) {
	try {
		// Unduh SVG dari URL
		const response = await fetch(svgUrl);
		const buffer = await response.buffer();
		const svgPath = path.join("/tmp", `temp_${Date.now()}.svg`);
		const jpgPath = svgPath.replace(".svg", ".jpg");

		// Simpan file SVG ke penyimpanan sementara
		fs.writeFileSync(svgPath, buffer);

		// Konversi SVG ke JPG menggunakan ImageMagick
		await new Promise((resolve, reject) => {
			exec(`convert ${svgPath} ${jpgPath}`, (error) => {
				if (error) return reject(error);
				resolve();
			});
		});

		// Hapus file SVG setelah dikonversi
		fs.unlinkSync(svgPath);

		return `file://${jpgPath}`;
	} catch (error) {
		console.error("❌ Gagal mengonversi SVG:", error);
		return "https://files.catbox.moe/aw1zie.jpg"; // Default gambar jika gagal
	}
}
