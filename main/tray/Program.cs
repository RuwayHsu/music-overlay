using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace MusicOverlayTray
{
    static class Program
    {
        private const string MUTEX_NAME = "Global\\MusicOverlay_SingleInstance_Mutex_2026";
        private const int SERVER_PORT = 50120;
        private static Mutex appMutex;
        private static Process nodeProcess;
        private static NotifyIcon trayIcon;
        private static string appDir;
        private static string nodeExecutable;
        private static string serverScript;

        [STAThread]
        static void Main()
        {
            bool createdNew;
            appMutex = new Mutex(true, MUTEX_NAME, out createdNew);

            if (!createdNew)
            {
                // 已有執行個體在運行，直接開啟瀏覽器中控台並退出此執行個體
                try
                {
                    Process.Start(new ProcessStartInfo("http://localhost:" + SERVER_PORT + "/index") { UseShellExecute = true });
                }
                catch { }
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            appDir = AppDomain.CurrentDomain.BaseDirectory;
            serverScript = Path.Combine(appDir, "main", "server.js");

            // 尋找 Node.js 執行檔（優先使用打包的 runtime\node.exe，次選系統 PATH）
            nodeExecutable = FindNodeExecutable();
            if (string.IsNullOrEmpty(nodeExecutable))
            {
                MessageBox.Show(
                    Locale.T("未偵測到 Node.js 執行環境！\n\n請確認此目錄下包含 runtime\\node.exe，或於電腦中安裝 Node.js (nodejs.org)。"),
                    Locale.T("Music Overlay — 啟動錯誤"),
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            if (!File.Exists(serverScript))
            {
                MessageBox.Show(
                    Locale.T("找不到伺服器核心腳本：\n") + serverScript,
                    Locale.T("Music Overlay — 檔案遺失"),
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // 註冊關閉事件以確保不會殘留背景進程
            Application.ApplicationExit += OnApplicationExit;
            AppDomain.CurrentDomain.ProcessExit += (s, e) => KillNodeProcess();

            // 啟動 Node.js 後端伺服器
            StartNodeProcess();

            // 初始化系統匣圖示
            InitTrayIcon();

            // 啟動後自動在預設瀏覽器開啟中控台
            try
            {
                Process.Start(new ProcessStartInfo("http://localhost:" + SERVER_PORT + "/index") { UseShellExecute = true });
            }
            catch { }

            Application.Run();
        }

        private static string FindNodeExecutable()
        {
            // 1. 優先尋找同層 runtime\node.exe
            string localRuntime = Path.Combine(appDir, "runtime", "node.exe");
            if (File.Exists(localRuntime)) return localRuntime;

            // 2. 尋找 bin\node.exe
            string binRuntime = Path.Combine(appDir, "bin", "node.exe");
            if (File.Exists(binRuntime)) return binRuntime;

            // 3. 尋找同層 node.exe
            string directNode = Path.Combine(appDir, "node.exe");
            if (File.Exists(directNode)) return directNode;

            // 4. 尋找系統 PATH
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                string[] paths = pathEnv.Split(';');
                foreach (string p in paths)
                {
                    string fullPath = Path.Combine(p.Trim(), "node.exe");
                    if (File.Exists(fullPath)) return fullPath;
                }
            }

            return null;
        }

        private static void StartNodeProcess()
        {
            KillNodeProcess();
            FreePortIfBusy(SERVER_PORT);

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = nodeExecutable;
                psi.Arguments = "\"" + serverScript + "\"";
                psi.WorkingDirectory = Path.Combine(appDir, "main");
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                psi.WindowStyle = ProcessWindowStyle.Hidden;

                nodeProcess = new Process();
                nodeProcess.StartInfo = psi;
                nodeProcess.EnableRaisingEvents = true;
                nodeProcess.Exited += (s, e) =>
                {
                    // 若非正常關閉，可記錄或視情況處理
                };

                nodeProcess.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show(Locale.T("啟動後端伺服器失敗：\n") + ex.Message, Locale.T("錯誤"), MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void FreePortIfBusy(int port)
        {
            try
            {
                Process p = new Process();
                p.StartInfo.FileName = "cmd.exe";
                p.StartInfo.Arguments = "/c netstat -ano | findstr :" + port;
                p.StartInfo.UseShellExecute = false;
                p.StartInfo.RedirectStandardOutput = true;
                p.StartInfo.CreateNoWindow = true;
                p.Start();
                string output = p.StandardOutput.ReadToEnd();
                p.WaitForExit(1000);

                if (!string.IsNullOrEmpty(output))
                {
                    string[] lines = output.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (string line in lines)
                    {
                        if (!line.Contains("LISTENING")) continue;
                        string[] parts = line.Trim().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 5)
                        {
                            int pid;
                            if (int.TryParse(parts[parts.Length - 1], out pid) && pid > 0)
                            {
                                try
                                {
                                    Process target = Process.GetProcessById(pid);
                                    if (target.ProcessName.ToLower().Contains("node"))
                                    {
                                        target.Kill();
                                        target.WaitForExit(1000);
                                    }
                                }
                                catch { }
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private static void KillNodeProcess()
        {
            if (nodeProcess != null && !nodeProcess.HasExited)
            {
                try
                {
                    nodeProcess.Kill();
                    nodeProcess.WaitForExit(1000);
                }
                catch { }
                finally
                {
                    nodeProcess = null;
                }
            }
        }

        private static void InitTrayIcon()
        {
            trayIcon = new NotifyIcon();
            trayIcon.Text = Locale.T("Music Overlay 控制中心");

            // 嘗試載入圖示（優先從程式自身圖示讀取，次選實體 app.ico）
            try
            {
                Icon appIco = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (appIco != null)
                {
                    trayIcon.Icon = appIco;
                }
            }
            catch { }

            if (trayIcon.Icon == null)
            {
                string icoPath = Path.Combine(appDir, "app.ico");
                if (File.Exists(icoPath))
                {
                    try { trayIcon.Icon = new Icon(icoPath); } catch { }
                }
            }

            if (trayIcon.Icon == null)
            {
                trayIcon.Icon = SystemIcons.Application;
            }

            // 右鍵功能表
            ContextMenuStrip menu = new ContextMenuStrip();

            ToolStripMenuItem itemConsole = new ToolStripMenuItem(Locale.T("開啟中控台"));
            itemConsole.Font = new Font(itemConsole.Font, FontStyle.Bold);
            itemConsole.Click += (s, e) => OpenUrl("http://localhost:" + SERVER_PORT + "/index");
            menu.Items.Add(itemConsole);

            ToolStripMenuItem itemP2 = new ToolStripMenuItem(Locale.T("橫向播放器 (Player 2 - 650x125)"));
            itemP2.Click += (s, e) => OpenUrl("http://localhost:" + SERVER_PORT + "/overlay?view=player2");
            menu.Items.Add(itemP2);

            ToolStripMenuItem itemP1 = new ToolStripMenuItem(Locale.T("直向播放器 (Player 1 - 380x510)"));
            itemP1.Click += (s, e) => OpenUrl("http://localhost:" + SERVER_PORT + "/overlay?view=player1");
            menu.Items.Add(itemP1);

            menu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem itemRestart = new ToolStripMenuItem(Locale.T("重新啟動伺服器"));
            itemRestart.Click += (s, e) =>
            {
                StartNodeProcess();
                trayIcon.ShowBalloonTip(1500, "Music Overlay", Locale.T("伺服器已重新啟動！"), ToolTipIcon.Info);
            };
            menu.Items.Add(itemRestart);

            ToolStripMenuItem itemFolder = new ToolStripMenuItem(Locale.T("開啟專案資料夾"));
            itemFolder.Click += (s, e) =>
            {
                try { Process.Start("explorer.exe", appDir); } catch { }
            };
            menu.Items.Add(itemFolder);

            menu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem itemExit = new ToolStripMenuItem(Locale.T("關閉並結束 (Exit)"));
            itemExit.Click += (s, e) =>
            {
                trayIcon.Visible = false;
                KillNodeProcess();
                Application.Exit();
            };
            menu.Items.Add(itemExit);

            trayIcon.ContextMenuStrip = menu;
            trayIcon.Visible = true;

            // 點擊事件：左鍵點擊直接開啟中控台
            trayIcon.DoubleClick += (s, e) => OpenUrl("http://localhost:" + SERVER_PORT + "/index");
            trayIcon.MouseClick += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    OpenUrl("http://localhost:" + SERVER_PORT + "/index");
                }
            };

            // 氣泡提示通知
            trayIcon.ShowBalloonTip(
                2000,
                Locale.T("Music Overlay 已啟動"),
                Locale.T("已在背景與系統匣運行 (支援 Twitch >np)。\n點擊開啟中控台，右鍵可隨時關閉。"),
                ToolTipIcon.Info
            );
        }

        private static void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show(Locale.T("無法開啟連結：") + ex.Message, Locale.T("錯誤"), MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private static void OnApplicationExit(object sender, EventArgs e)
        {
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }
            KillNodeProcess();
            if (appMutex != null)
            {
                appMutex.ReleaseMutex();
                appMutex.Dispose();
            }
        }
    }
}
