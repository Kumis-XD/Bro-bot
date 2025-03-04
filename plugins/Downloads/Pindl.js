import axios from "axios";

export default {
	command: ".pindl",
	name: "「 PINTEREST DOWNLOADS 」",
	description: "Download gambar dari Pinterest dan mengirimkannya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Gunakan regex untuk mengambil URL setelah perintah
			const urlMatch = text.match(/^\.pindl\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Cek apakah URL valid
			if (!url || !url.startsWith("http")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan link Pinterest yang valid!",
				});
				return;
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil gambar...",
			});

			// Fungsi dengan timeout untuk mencegah 504 Gateway Timeout
			const fetchWithTimeout = (url, timeout = 15000) => {
				return Promise.race([
					axios.get(url),
					new Promise((_, reject) =>
						setTimeout(
							() =>
								reject(
									new Error("⏳ Server timeout, coba lagi!"),
								),
							timeout,
						),
					),
				]);
			};

			// Ambil data dari API Siputzx
			let response = await fetchWithTimeout(
				`https://api.siputzx.my.id/api/d/pinterest?url=${url}`,
			);
			const pin = response.data?.data;

			// Jika tidak ada data gambar, kirim pesan error
			if (!pin || !pin.url) {
				await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengambil gambar! Coba link lain.",
				});
				return;
			}

			// Format tanggal menjadi lebih rapi
			const dateObj = new Date(pin.created_at);
			const formattedDate = dateObj.toLocaleString("id-ID", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				timeZoneName: "short",
			});

			// Kirim gambar dengan keterangan
			let caption = `
📌 *Pinterest Download*
📅 *Dibuat pada:* ${formattedDate}
`;

			await sock.sendMessage(
				sender,
				{
					image: { url: pin.url },
					caption: caption,
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
