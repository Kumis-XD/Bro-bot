import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

app.use(cors());
app.use(express.json());

// Menyajikan file HTML dari folder 'view'
app.use(express.static(path.join(__dirname, "view")));

// Route utama untuk menampilkan dashboard
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "view", "dashboard.html"));
});

app.get("/setting", (req, res) => {
	res.sendFile(path.join(__dirname, "view", "setting.html"));
});

// Menjalankan server di port 3000
server.listen(4000, () => {
	console.log("🚀 Dashboard berjalan di http://localhost:3000");
});

export { io };
