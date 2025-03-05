import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Menggunakan path relatif yang menunjuk ke ../../data/token.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/token.json");

// Memuat token yang telah disimpan ke dalam file
export const loadToken = () => {
	try {
		// Memeriksa apakah file ada
		if (!fs.existsSync(CONFIG_FILE)) {
			// Jika file tidak ada, buat file baru dengan objek kosong
			saveToken({});
		}
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
	} catch (error) {
		console.error("❌ Error saat memuat token:", error);
		return {}; // Default objek kosong jika terjadi error
	}
};

// Menyimpan token ke file JSON
export const saveToken = (tokens) => {
	try {
		// Pastikan direktori untuk file sudah ada
		const dir = path.dirname(CONFIG_FILE);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true }); // Membuat direktori jika tidak ada
		}

		// Menyimpan token ke file JSON
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(tokens, null, 2));
	} catch (error) {
		console.error("❌ Error saat menyimpan token:", error);
	}
};

// Fungsi untuk membuat token JWT dengan nomor ponsel dan periode kadaluwarsa
export default {
	command: ".ctoken", // Perintah untuk membuat token JWT
	name: "「 CREATE TOKEN 」",
	description: "Buat Token untuk bot.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Pisahkan teks menjadi array berdasarkan spasi
			const args = text.split(/\s+/).slice(1); // Mengabaikan perintah (.ctoken)

			// Periksa apakah args cukup
			if (args.length < 2) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap berikan nomor ponsel (dimulai dengan 62) dan periode kadaluwarsa (dalam hari). Contoh: .ctoken 628123456789 30",
				});
				return;
			}

			// Ambil nomor ponsel (args[0])
			let phoneNumber = args[0];
			if (
				!phoneNumber ||
				!/^\d{10,}$/g.test(phoneNumber) ||
				!phoneNumber.startsWith("62")
			) {
				await sock.sendMessage(sender, {
					text: "⚠️ Nomor ponsel tidak valid! Harap masukkan nomor ponsel yang dimulai dengan 62 dan terdiri dari angka.",
				});
				return;
			}

			// Ambil periode kadaluwarsa (args[1])
			const expired = parseInt(args[1]);
			if (isNaN(expired) || expired <= 0) {
				await sock.sendMessage(sender, {
					text: "⚠️ Periode kadaluwarsa harus berupa angka positif yang valid!",
				});
				return;
			}

			// Payload yang akan digunakan untuk membuat JWT
			const payload = {
				phoneNumber, // Nomor ponsel
				expired, // Durasi berlaku token (dalam hari)
				createdAt: new Date().toISOString(), // Waktu pembuatan token
			};

			// Buat JWT dengan payload dan secret key
			const token = jwt.sign(payload, process.env.SECRETKEY, {
				expiresIn: `${expired}d`, // Token akan kedaluwarsa setelah periode yang ditentukan
			});

			// Token data yang akan disimpan
			const tokenData = {
				token,
				expired,
				createdAt: new Date().toISOString(),
			};

			// Muat token yang ada dan perbarui dengan token baru
			const tokens = loadToken();
			tokens[phoneNumber] = tokenData; // Simpan token dengan nomor ponsel sebagai key

			// Simpan token baru ke file
			saveToken(tokens);

			// Kirimkan token kepada pengguna
			await sock.sendMessage(sender, {
				text: `✅ Token JWT berhasil dibuat!\n\n🔑 Token: ${token}\n📅 Periode: ${expired} hari\n📱 Nomor Ponsel: ${phoneNumber}`,
			});
		} catch (error) {
			console.error("❌ Terjadi kesalahan:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan dalam pembuatan token JWT! Coba lagi nanti.",
			});
		}
	},
};
