using System;
using System.Globalization;

namespace MusicOverlayTray
{
    // Tray strings use the Windows UI language. Browser and extension choices are stored separately.
    static class Locale
    {
        private static readonly int Language = Detect();

        // zh-CN, zh-HK, en-US, ja-JP, ko-KR; source is zh-TW.
        private static readonly string[][] Phrases = new string[][] {
            new string[] { "未偵測到 Node.js 執行環境！", "未检测到 Node.js 运行环境！", "搵唔到 Node.js 執行環境！", "Node.js runtime was not found!", "Node.js 実行環境が見つかりません！", "Node.js 실행 환경을 찾지 못했습니다!" },
            new string[] { "請確認此目錄下包含 runtime\\node.exe，或於電腦中安裝 Node.js (nodejs.org)。", "请确认此目录包含 runtime\\node.exe，或在电脑上安装 Node.js (nodejs.org)。", "請確認呢個資料夾有 runtime\\node.exe，或者喺電腦安裝 Node.js (nodejs.org)。", "Make sure this folder contains runtime\\node.exe, or install Node.js (nodejs.org).", "このフォルダーに runtime\\node.exe を配置するか、Node.js (nodejs.org) をインストールしてください。", "이 폴더에 runtime\\node.exe가 있는지 확인하거나 Node.js (nodejs.org)를 설치하세요." },
            new string[] { "已在背景與系統匣運行 (支援 Twitch >np)。\n點擊開啟中控台，右鍵可隨時關閉。", "已在后台和系统托盘运行（支持 Twitch >np）。\n单击打开控制台，右键可随时退出。", "已經喺背景同系統匣運行（支援 Twitch >np）。\n撳一下開控制台，右鍵可以隨時離開。", "Running in the background and system tray (Twitch >np supported).\nClick to open the control panel; right-click to exit.", "バックグラウンドとシステムトレイで実行中（Twitch >np 対応）。\nクリックで設定画面、右クリックで終了します。", "백그라운드와 시스템 트레이에서 실행 중입니다 (Twitch >np 지원).\n클릭하면 제어판이 열리고 오른쪽 클릭으로 종료할 수 있습니다." },
            new string[] { "已在背景與系統匣運行。\n點擊開啟中控台，右鍵可隨時關閉。", "已在后台和系统托盘运行。\n单击打开控制台，右键可随时退出。", "已經喺背景同系統匣運行。\n撳一下開控制台，右鍵可以隨時離開。", "Running in the background and system tray.\nClick to open the control panel; right-click to exit.", "バックグラウンドとシステムトレイで実行中。\nクリックで設定画面、右クリックで終了します。", "백그라운드와 시스템 트레이에서 실행 중입니다.\n클릭하면 제어판이 열리고 오른쪽 클릭으로 종료할 수 있습니다." },
            new string[] { "橫向播放器 (Player 2 - 650x125)", "横向播放器 (Player 2 - 650x125)", "橫向播放器 (Player 2 - 650x125)", "Horizontal player (Player 2 - 650x125)", "横型プレーヤー (Player 2 - 650x125)", "가로 플레이어 (Player 2 - 650x125)" },
            new string[] { "直向播放器 (Player 1 - 380x510)", "纵向播放器 (Player 1 - 380x510)", "直向播放器 (Player 1 - 380x510)", "Vertical player (Player 1 - 380x510)", "縦型プレーヤー (Player 1 - 380x510)", "세로 플레이어 (Player 1 - 380x510)" },
            new string[] { "找不到伺服器核心腳本：", "找不到服务器核心脚本：", "搵唔到伺服器核心腳本：", "Server script not found: ", "サーバースクリプトが見つかりません：", "서버 스크립트를 찾지 못했습니다: " },
            new string[] { "啟動後端伺服器失敗：", "启动后端服务器失败：", "啟動後端伺服器失敗：", "Failed to start the server: ", "サーバーを起動できません：", "서버 시작 실패: " },
            new string[] { "無法開啟連結：", "无法打开链接：", "開唔到連結：", "Could not open link: ", "リンクを開けません：", "링크를 열 수 없습니다: " },
            new string[] { "伺服器已重新啟動！", "服务器已重新启动！", "伺服器已重新啟動！", "Server restarted!", "サーバーを再起動しました！", "서버를 다시 시작했습니다!" },
            new string[] { "重新啟動伺服器", "重新启动服务器", "重新啟動伺服器", "Restart server", "サーバーを再起動", "서버 다시 시작" },
            new string[] { "開啟專案資料夾", "打开项目文件夹", "開啟專案資料夾", "Open project folder", "プロジェクトフォルダーを開く", "프로젝트 폴더 열기" },
            new string[] { "關閉並結束 (Exit)", "关闭并退出 (Exit)", "關閉並離開 (Exit)", "Exit", "終了", "종료" },
            new string[] { "開啟中控台", "打开控制台", "開啟控制台", "Open control panel", "コントロールパネルを開く", "제어판 열기" },
            new string[] { "控制中心", "控制中心", "控制中心", "Control center", "コントロールセンター", "제어 센터" },
            new string[] { "啟動錯誤", "启动错误", "啟動錯誤", "Startup error", "起動エラー", "시작 오류" },
            new string[] { "檔案遺失", "文件丢失", "檔案遺失", "Missing file", "ファイルがありません", "파일 없음" },
            new string[] { "已啟動", "已启动", "已啟動", "started", "起動しました", "시작됨" },
            new string[] { "錯誤", "错误", "錯誤", "Error", "エラー", "오류" }
        };

        private static int Detect()
        {
            string culture = CultureInfo.CurrentUICulture.Name.ToLowerInvariant();
            if (culture.StartsWith("zh-hk") || culture.StartsWith("zh-mo")) return 2;
            if (culture.StartsWith("zh-cn") || culture.StartsWith("zh-sg")) return 1;
            if (culture.StartsWith("zh")) return 0;
            if (culture.StartsWith("ja")) return 4;
            if (culture.StartsWith("ko")) return 5;
            return 3;
        }

        internal static string T(string source)
        {
            if (Language == 0) return source;
            foreach (string[] row in Phrases)
                source = source.Replace(row[0], row[Language]);
            return source;
        }
    }
}
