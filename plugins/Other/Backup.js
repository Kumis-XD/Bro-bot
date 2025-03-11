import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_FOLDER = path.resolve(__dirname, "../../"); // Folder utama bot
const BACKUP_DIR = path.resolve(__dirname, "../Tmp/"); // Folder penyimpanan backup

const IGNORED_ITEMS = [
	"LICENSE",
	"package-lock.json",
	".git",
	"sessions",
	"node_modules",
	".gitignore",
];

// Membuat nama file berdasarkan tanggal
const getBackupFileName = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0"); // Bulan dimulai dari 0
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}.zip`;
};

export default {
	command: ".backup",
	name: "「 SYSTEM BACKUP 」",
	description: "Membuat backup semua file bot dalam format ZIP.",
	execute: async (sock, sender, text, msg) => {
		try {
			const backupFileName = getBackupFileName(); // Buat nama file berdasarkan tanggal
			const BACKUP_FILE = path.join(BACKUP_DIR, backupFileName); // Path lengkap

			await sock.sendMessage(sender, {
				text: "⏳ Sedang membuat backup...",
			});

			// Panggil fungsi backup
			await createBackup(BACKUP_FILE);

			// Ambil ukuran file backup
			const fileSize = getFileSize(BACKUP_FILE);

			// Kirim file ZIP ke WhatsApp
			await sock.sendMessage(
				sender,
				{
					document: fs.readFileSync(BACKUP_FILE),
					mimetype: "application/zip",
					fileName: backupFileName,
					caption: `✅ *Backup selesai!*\n\n📁 *Nama:* ${backupFileName}\n📦 *Ukuran:* ${fileSize}`,
				},
				{ quoted: msg },
			);

			// Hapus file backup setelah dikirim
			fs.unlinkSync(BACKUP_FILE);
		} catch (error) {
			console.error("❌ Error saat membuat backup:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan saat membuat backup.",
			});
		}
	},
};

// Fungsi untuk membuat backup dalam format ZIP
async function createBackup(BACKUP_FILE) {
	return new Promise((resolve, reject) => {
		// Pastikan folder penyimpanan ada
		if (!fs.existsSync(BACKUP_DIR)) {
			fs.mkdirSync(BACKUP_DIR, { recursive: true });
		}

		const output = fs.createWriteStream(BACKUP_FILE);
		const archive = archiver("zip", { zlib: { level: 9 } });

		output.on("close", resolve);
		archive.on("error", reject);

		archive.pipe(output);

		// Tambahkan semua folder dan file kecuali yang diabaikan
		fs.readdirSync(BACKUP_FOLDER).forEach((item) => {
			const itemPath = path.join(BACKUP_FOLDER, item);
			if (!IGNORED_ITEMS.includes(item)) {
				if (fs.lstatSync(itemPath).isDirectory()) {
					archive.directory(itemPath, item);
				} else {
					archive.file(itemPath, { name: item });
				}
			}
		});

		archive.finalize();
	});
}

// Fungsi untuk mendapatkan ukuran file dalam format yang mudah dibaca
function getFileSize(filePath) {
	try {
		const stats = fs.statSync(filePath);
		const fileSizeInBytes = stats.size;
		const fileSizeInMB = fileSizeInBytes / (1024 * 1024); // Konversi ke MB
		return `${fileSizeInMB.toFixed(2)} MB`;
	} catch (error) {
		console.error("❌ Gagal mendapatkan ukuran file:", error);
		return "Unknown";
	}
}
