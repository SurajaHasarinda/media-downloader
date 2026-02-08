# 🎬 Media Downloader

**Media Downloader** is a powerful application designed to automate your movie downloading experience. It allows you to search for movies via **TMDB**, search for torrents using **Prowlarr**, and automatically queue downloads in **qBittorrent**—all from a single interface. 🚀

---

## ✨ Features

- 🔍 **Movie Search**: Instantly search for movies using the TMDB API.
- 📝 **Wishlist Management**: specific movies to your wishlist to track what you want to watch.
- 🤖 **Auto-Download**: Automatically searches for high-quality torrents via Prowlarr and queues them in qBittorrent.
- 📅 **Smart Scheduling**: Set up automated background tasks to check for new releases and retry failed downloads.
- 🔐 **Authentication**: Secure login system with default admin credentials.
- ⚙️ **Settings Management**: Configure your quality profiles, detailed indexer settings, and more directly from the UI.

---

## 🛠️ Tech Stack

- **Backend Framework**: [FastAPI](https://fastapi.tiangolo.com/) ⚡
- **Database**: [SQLite](https://www.sqlite.org/index.html) 🗄️
- **Torrent Indexer**: [Prowlarr](https://prowlarr.com/) 🔎
- **Download Client**: [qBittorrent](https://www.qbittorrent.org/) ⬇️

---

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (Recommended)
- OR **Python 3.10+** (for manual setup)

### 🐳 Installation via Docker (Recommended)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/media-downloader.git
    cd media-downloader
    ```

2.  **Start the Services**
    Run the full stack (App + Prowlarr + qBittorrent):
    ```bash
    docker-compose -f docker-compose.media-downloader.yml up -d
    ```

3.  **Access the Application**
    - **Media Downloader**: `http://localhost:8095`
    - **Prowlarr**: `http://localhost:9696`
    - **qBittorrent**: `http://localhost:8080` (Default: `admin` / `adminadmin`)

---

### 🔧 Manual Installation

If you prefer running without Docker:

1.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure Environment**
    Copy the example environment file and update it with your API keys (TMDB, etc.):
    ```bash
    cp .env.example .env
    ```

3.  **Run the Application**
    ```bash
    python main.py
    # OR using Uvicorn directly
    uvicorn main:app --host 0.0.0.0 --port 8095 --reload
    ```

---

## 📖 Usage Guide

### 1️⃣ Initial Setup
- **Login**: Use the default credentials:
  - **Username**: `admin`
  - **Password**: `admin123`
  *(⚠️ Please change these immediately after logging in!)*

### 2️⃣ Configure Services
- Go to **Settings** and ensure your **TMDB API Key** is set.
- Configure **Prowlarr** and **qBittorrent** URLs if they differ from the defaults.

### 3️⃣ Add Movies & Download
- Use the **Search** tab to find a movie.
- Click **Add to Wishlist**.
- The **Scheduler** (or manual trigger) will check Prowlarr for torrents matching your quality settings.
- Once found, the download starts automatically in qBittorrent! 🍿

---

## 📂 Project Structure

```bash
media-downloader/
├── config/                 # ⚙️ Configuration files
├── data/                   # 🗄️ SQLite Database
├── downloads/              # 📥 Download directory (mapped to qBittorrent)
├── src/
│   ├── controllers/        # 🎮 API Routes
│   ├── database/           # 💾 DB Models & Logic
│   ├── services/           # 🔌 External Services (TMDB, Prowlarr, qBit)
│   └── main.py             # 🏁 App Entry Point
├── ui/                     # 🎨 Frontend Source
├── docker-compose.media-downloader.yml
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
