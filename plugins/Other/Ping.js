import { performance } from "perf_hooks";
import si from "systeminformation";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

// Data umum
const botname = process.env.BOT_NAME || "Bro-Bot";

// Simpan waktu saat bot dinyalakan
const startTime = performance.now();

// Fungsi untuk membuat progress bar
const createProgressBar = (percentage, length = 10) => {
	const filled = Math.round((percentage / 100) * length);
	const empty = length - filled;
	return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage.toFixed(
		2,
	)}%`;
};

export default {
	command: ".ping",
	name: "「 NETWORK & SYSTEM 」",
	description:
		"Menampilkan ping, runtime bot, penggunaan RAM, CPU Load, Storage, dan Info Sistem",
	execute: async (sock, sender, id, text, msg) => {
		const pingStart = performance.now(); // Waktu sebelum eksekusi perintah

		// Hitung runtime bot
		const runtime = () => {
			let totalSeconds = Math.floor(
				(performance.now() - startTime) / 1000,
			);
			let hours = Math.floor(totalSeconds / 3600);
			let minutes = Math.floor((totalSeconds % 3600) / 60);
			let seconds = totalSeconds % 60;
			return `${hours} jam, ${minutes} menit, ${seconds} detik`;
		};

		// Ambil informasi sistem
		let ramUsage = "💾 Tidak diketahui";
		let cpuLoad = "🖥️ *Tidak diketahui*";
		let storageInfo = "📂 *Tidak diketahui*";
		let systemInfo = "🖥️ *Tidak diketahui*";
		let networkInfo = "🌐 *Tidak diketahui*";

		try {
			// Informasi RAM
			const mem = await si.mem();
			const usedMb = (mem.active / 1024 / 1024).toFixed(2);
			const totalMb = (mem.total / 1024 / 1024).toFixed(2);
			const ramPercent = (mem.active / mem.total) * 100;
			ramUsage = `💾 *RAM Usage:* ${usedMb} MB / ${totalMb} MB\n   ${createProgressBar(
				ramPercent,
			)}`;

			// Load CPU dalam %
			const cpu = await si.currentLoad();
			cpuLoad = `🖥️ *CPU Load:* ${cpu.currentLoad.toFixed(
				2,
			)}%\n   ${createProgressBar(cpu.currentLoad)}`;

			// Info Storage (Total & Free)
			const disk = await si.fsSize();
			if (disk.length > 0) {
				const usedStorage = (disk[0].used / 1024 / 1024 / 1024).toFixed(
					2,
				);
				const totalStorage = (
					disk[0].size /
					1024 /
					1024 /
					1024
				).toFixed(2);
				const storagePercent = (disk[0].used / disk[0].size) * 100;
				storageInfo = `📂 *Storage:* ${usedStorage} GB / ${totalStorage} GB\n   ${createProgressBar(
					storagePercent,
				)}`;
			}

			// Info Sistem (OS & CPU)
			const sys = await si.system();
			const cpuInfo = await si.cpu();
			systemInfo = `🖥️ *System:* ${sys.manufacturer} ${sys.model}\n💾 *CPU:* ${cpuInfo.manufacturer} ${cpuInfo.brand} (${cpuInfo.cores} Cores)`;

			// Info Jaringan (IP & Kecepatan)
			const net = await si.networkInterfaces();
			const network = net.find((n) => n.internal === false);
			if (network) {
				networkInfo = `🌐 *Network:* ${network.iface} - ${
					network.ip4 || "No IP"
				}\n   📡 *MAC:* ${network.mac}`;
			}
		} catch (error) {
			console.error("Gagal mendapatkan informasi sistem:", error);
		}

		const pingEnd = performance.now(); // Waktu setelah eksekusi perintah
		const latency = (pingEnd - pingStart).toFixed(2); // Hitung latency

		// Kirim pesan ke pengguna
		await sock.sendMessage(sender, {
			text: `🎛 *Status Sistem*\n📌 *Latency:* ${latency} ms\n⏳ *Uptime:* ${runtime()}\n${cpuLoad}\n${ramUsage}\n${storageInfo}\n\n🔍 *Informasi Tambahan*\n${systemInfo}\n${networkInfo}`,
			title: `🔧 System Info`,
			subtitle: `💡 Semua data sistem berhasil diambil`,
			footer: `🤖 ${botname} | 🚀 Powered by SystemInformation`,
			viewOnce: true,
			shop: 3,
			id: "03062006",
		});
	},
};
