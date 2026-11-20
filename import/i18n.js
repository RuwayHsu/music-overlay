/* Music Overlay UI translations. Each row is zh-TW: [zh-CN, zh-HK, en-US, ja-JP, ko-KR]. */
(() => {
  'use strict';
  const languages = ['zh-TW', 'zh-CN', 'zh-HK', 'en-US', 'ja-JP', 'ko-KR'];
  const names = ['繁體中文', '简体中文', '粵語', 'English (US)', '日本語', '한국어'];
  const rows = {
    '中控台': ['控制台','控制台','Control panel','コントロールパネル','제어판'],
    '中控台 — Music Player Overlay': ['控制台 — Music Player Overlay','控制台 — Music Player Overlay','Control panel — Music Player Overlay','コントロールパネル — Music Player Overlay','제어판 — Music Player Overlay'],
    '伺服器連線中': ['服务器连接中','伺服器連線中','Connecting to server','サーバーに接続中','서버 연결 중'],
    '等待播放數據': ['等待播放数据','等緊播放資料','Waiting for playback data','再生データを待機中','재생 데이터 대기 중'],
    '看我看我!!': ['看看我!!','睇下我!!','Visit my page','私のページ','페이지 보기'],
    '系統狀態': ['系统状态','系統狀態','System status','システム状態','시스템 상태'],
    '本機伺服器': ['本地服务器','本機伺服器','Local server','ローカルサーバー','로컬 서버'],
    '正在連線...': ['正在连接...','連線中...','Connecting...','接続中...','연결 중...'],
    'YouTube 數據': ['YouTube 数据','YouTube 資料','YouTube data','YouTube データ','YouTube 데이터'],
    '媒體串流數據': ['媒体流数据','媒體串流資料','Media stream data','メディア配信データ','미디어 스트림 데이터'],
    '檢查中...': ['检查中...','檢查緊...','Checking...','確認中...','확인 중...'],
    '現正播放': ['正在播放','播放緊','Now playing','再生中','지금 재생 중'],
    '縮圖': ['缩略图','縮圖','Thumbnail','サムネイル','썸네일'],
    '設定提示': ['设置提示','設定提示','Setup tips','設定のヒント','설정 안내'],
    '尚未收到 YouTube 數據': ['尚未收到 YouTube 数据','仲未收到 YouTube 資料','No YouTube data yet','YouTube データ未受信','YouTube 데이터를 받지 못함'],
    '尚未收到媒體串流數據': ['尚未收到媒体流数据','仲未收到媒體串流資料','No media data yet','メディアデータ未受信','미디어 데이터를 받지 못함'],
    '在 Chrome 載入': ['在 Chrome 中加载','喺 Chrome 載入','Load the','Chrome に','Chrome에서'],
    '擴充功能': ['扩展程序','擴充功能','extension in Chrome','拡張機能を読み込む','확장 프로그램 로드'],
    '開啟 YouTube 播放分頁': ['打开 YouTube 播放标签页','開啟 YouTube 播放分頁','Open a YouTube video tab','YouTube 動画タブを開く','YouTube 동영상 탭 열기'],
    '開啟 YouTube、Spotify、SoundCloud 或 Twitch 分頁': ['打开 YouTube、Spotify、SoundCloud 或 Twitch 标签页','開啟 YouTube、Spotify、SoundCloud 或 Twitch 分頁','Open a YouTube, Spotify, SoundCloud, or Twitch tab','YouTube、Spotify、SoundCloud、Twitch のタブを開く','YouTube, Spotify, SoundCloud 또는 Twitch 탭 열기'],
    '點擊擴充功能圖示並「開始投影」': ['点击扩展程序图标并选择“开始投影”','撳擴充功能圖示，再揀「開始投影」','Click the extension icon and start casting','拡張機能アイコンから配信を開始','확장 프로그램 아이콘에서 송출 시작'],
    '伺服器未連線': ['服务器未连接','伺服器未連線','Server disconnected','サーバー未接続','서버 연결 끊김'],
    '執行': ['运行','執行','Run','実行','실행'],
    '啟動伺服器': ['启动服务器','啟動伺服器','to start the server','でサーバーを起動','서버 시작'],
    '主題預設': ['主题预设','主題預設','Theme presets','テーマプリセット','테마 프리셋'],
    '預設底色': ['默认底色','預設底色','Default','デフォルト','기본'],
    '賽博龐克': ['赛博朋克','賽博龐克','Cyberpunk','サイバーパンク','사이버펑크'],
    '日系粉櫻': ['日系粉樱','日系粉櫻','Sakura','桜','벚꽃'],
    '復古終端': ['复古终端','懷舊終端','Retro terminal','レトロ端末','레트로 터미널'],
    '北歐極簡': ['北欧极简','北歐極簡','Nordic minimal','北欧ミニマル','북유럽 미니멀'],
    'OBS 來源網址': ['OBS 来源网址','OBS 來源網址','OBS source URLs','OBS ソース URL','OBS 소스 URL'],
    '複製網址貼入 OBS 瀏覽器來源，CSS 貼入「自訂 CSS」欄位即生效': ['复制网址到 OBS 浏览器源，将 CSS 粘贴到“自定义 CSS”栏即可生效','複製網址去 OBS 瀏覽器來源，再貼 CSS 去「自訂 CSS」欄位','Paste the URL into an OBS Browser Source and the CSS into Custom CSS','URL を OBS ブラウザーソースに、CSS をカスタム CSS に貼り付け','URL을 OBS 브라우저 소스에, CSS를 사용자 지정 CSS에 붙여넣기'],
    '複製橫向 OBS 網址': ['复制横向 OBS 网址','複製橫向 OBS 網址','Copy horizontal OBS URL','横型 OBS URL をコピー','가로 OBS URL 복사'],
    '複製直向 OBS 網址': ['复制纵向 OBS 网址','複製直向 OBS 網址','Copy vertical OBS URL','縦型 OBS URL をコピー','세로 OBS URL 복사'],
    '橫向 650 × 125': ['横向 650 × 125','橫向 650 × 125','Horizontal 650 × 125','横型 650 × 125','가로 650 × 125'],
    '直向 380 × 510': ['纵向 380 × 510','直向 380 × 510','Vertical 380 × 510','縦型 380 × 510','세로 380 × 510'],
    '獨立開啟預覽': ['单独打开预览','獨立開啟預覽','Open preview','プレビューを開く','미리보기 열기'],
    '視覺化調色盤': ['可视化调色板','視覺化調色盤','Visual palette','ビジュアルパレット','시각적 팔레트'],
    'CSS 編輯器': ['CSS 编辑器','CSS 編輯器','CSS editor','CSS エディター','CSS 편집기'],
    '重設預設': ['恢复默认','重設預設','Reset to default','初期設定に戻す','기본값 복원'],
    '複製 CSS 到 OBS': ['复制 CSS 到 OBS','複製 CSS 去 OBS','Copy CSS for OBS','OBS 用 CSS をコピー','OBS용 CSS 복사'],
    '卡片外觀': ['卡片外观','卡片外觀','Card appearance','カードの外観','카드 모양'],
    '背景底色': ['背景颜色','背景底色','Background color','背景色','배경색'],
    '邊框色彩': ['边框颜色','邊框色彩','Border color','枠線の色','테두리 색'],
    '毛玻璃模糊': ['毛玻璃模糊','磨砂玻璃模糊','Glass blur','ぼかし','블러'],
    '圓角大小': ['圆角大小','圓角大小','Corner radius','角丸の半径','모서리 둥글기'],
    '文字顏色': ['文字颜色','文字顏色','Text colors','文字色','텍스트 색'],
    '歌曲標題': ['歌曲标题','歌曲標題','Song title','曲名','노래 제목'],
    '時間 / 次要': ['时间 / 次要','時間 / 次要','Time / secondary','時間 / 補助','시간 / 보조'],
    '進度條色彩': ['进度条颜色','進度條色彩','Progress bar colors','進行バーの色','진행 표시줄 색'],
    '漸層起點': ['渐变起点','漸層起點','Gradient start','グラデーション開始色','그라데이션 시작'],
    '漸層終點': ['渐变终点','漸層終點','Gradient end','グラデーション終了色','그라데이션 끝'],
    '底軌顏色': ['轨道颜色','底軌顏色','Track color','トラックの色','트랙 색'],
    '頻譜動畫 (5條)': ['频谱动画（5 条）','頻譜動畫（5 條）','Spectrum animation (5 bars)','スペクトラム（5 本）','스펙트럼 애니메이션 (5개)'],
    '底端色': ['底部颜色','底端色','Bottom color','下の色','아래쪽 색'],
    '頂端色': ['顶部颜色','頂端色','Top color','上の色','위쪽 색'],
    ':root { /* 在此輸入自訂 CSS... */ }': [':root { /* 在此输入自定义 CSS... */ }',':root { /* 喺度輸入自訂 CSS... */ }',':root { /* Enter custom CSS here... */ }',':root { /* カスタム CSS を入力... */ }',':root { /* 사용자 지정 CSS 입력... */ }'],
    '等待資訊...': ['等待信息...','等緊資料...','Waiting for media...','メディアを待機中...','미디어 대기 중...'],
    '等待播放中...': ['等待播放中...','等緊播放...','Waiting for playback...','再生待機中...','재생 대기 중...'],
    '等待 YouTube 播放...': ['等待 YouTube 播放...','等緊 YouTube 播放...','Waiting for YouTube...','YouTube を待機中...','YouTube 대기 중...'],
    '等待 YouTube 資訊...': ['等待 YouTube 信息...','等緊 YouTube 資料...','Waiting for YouTube data...','YouTube 情報を待機中...','YouTube 정보 대기 중...'],
    '等待媒體資訊...': ['等待媒体信息...','等緊媒體資料...','Waiting for media data...','メディア情報を待機中...','미디어 정보 대기 중...'],
    '等待媒體播放...': ['等待媒体播放...','等緊媒體播放...','Waiting for media...','メディアを待機中...','미디어 대기 중...'],
    '未找到標題': ['未找到标题','搵唔到標題','Title not found','タイトルが見つかりません','제목을 찾지 못함'],
    '投影分頁': ['投影标签页','投影分頁','Cast tab','配信するタブ','송출 탭'],
    '投影': ['投影','投影','Cast','配信','송출'],
    '重整': ['刷新','重新整理','Refresh','更新','새로고침'],
    '載入中...': ['加载中...','載入中...','Loading...','読み込み中...','불러오는 중...'],
    '載入分頁中...': ['正在加载标签页...','載入分頁中...','Loading tabs...','タブを読み込み中...','탭 불러오는 중...'],
    '未偵測到 YouTube 播放分頁': ['未检测到 YouTube 播放标签页','搵唔到 YouTube 播放分頁','No YouTube video tabs found','YouTube 動画タブがありません','YouTube 동영상 탭을 찾지 못함'],
    '未偵測到支援的媒體播放分頁': ['未检测到支持的媒体播放标签页','搵唔到支援嘅媒體播放分頁','No supported media tabs found','対応するメディアタブがありません','지원하는 미디어 탭을 찾지 못함'],
    '請先在瀏覽器中打開 YouTube 影片': ['请先在浏览器中打开 YouTube 视频','請先喺瀏覽器開 YouTube 影片','Open a YouTube video in your browser first','ブラウザーで YouTube 動画を開いてください','먼저 브라우저에서 YouTube 동영상을 여세요'],
    '請先開啟 YouTube、Spotify、SoundCloud 或 Twitch 分頁': ['请先打开 YouTube、Spotify、SoundCloud 或 Twitch 标签页','請先開啟 YouTube、Spotify、SoundCloud 或 Twitch 分頁','Open a YouTube, Spotify, SoundCloud, or Twitch tab first','YouTube、Spotify、SoundCloud、Twitch のタブを開いてください','먼저 YouTube, Spotify, SoundCloud 또는 Twitch 탭을 여세요'],
    '停止投影': ['停止投影','停止投影','Stop casting','配信を停止','송출 중지'],
    '開始投影': ['开始投影','開始投影','Start casting','配信を開始','송출 시작'],
    '切換投影至此': ['切换投影到此页','轉投影到呢頁','Cast this tab instead','このタブに切り替え','이 탭으로 송출 전환'],
    '✓ 此分頁正在投影中': ['✓ 此标签页正在投影','✓ 呢個分頁投影緊','✓ This tab is casting','✓ このタブを配信中','✓ 이 탭 송출 중'],
    '注意：目前另一個分頁正在投影中': ['注意：另一个标签页正在投影','留意：另一個分頁投影緊','Another tab is currently casting','別のタブを配信中です','현재 다른 탭을 송출 중입니다'],
    '伺服器連線狀態': ['服务器连接状态','伺服器連線狀態','Server connection status','サーバー接続状態','서버 연결 상태'],
    '伺服器已連線': ['服务器已连接','伺服器已連線','Server connected','サーバー接続済み','서버 연결됨'],
    '伺服器未連線 (localhost:50120)': ['服务器未连接 (localhost:50120)','伺服器未連線 (localhost:50120)','Server disconnected (localhost:50120)','サーバー未接続 (localhost:50120)','서버 연결 끊김 (localhost:50120)'],
    'LIVE 直播中': ['LIVE 直播中','LIVE 直播緊','LIVE','LIVE 配信中','LIVE 방송 중'],
    '直播中': ['直播中','直播緊','Live','ライブ配信中','라이브 중'],
    '播放中': ['播放中','播放緊','Playing','再生中','재생 중'],
    '已暫停': ['已暂停','已暫停','Paused','一時停止','일시 중지'],
    '尚未收到數據': ['尚未收到数据','仲未收到資料','No data received','データ未受信','데이터를 받지 못함'],
    '已抓取播放數據': ['已获取播放数据','已擷取播放資料','Playback data received','再生データを受信','재생 데이터 수신됨'],
    '無法取得數據': ['无法获取数据','攞唔到資料','Unable to get data','データを取得できません','데이터를 가져올 수 없음'],
    '無法獲取數據': ['无法获取数据','攞唔到資料','Unable to get data','データを取得できません','데이터를 가져올 수 없음'],
    '連線中...': ['连接中...','連線中...','Connecting...','接続中...','연결 중...'],
    '連線失敗': ['连接失败','連線失敗','Connection failed','接続失敗','연결 실패'],
    '未連線': ['未连接','未連線','Disconnected','未接続','연결 안 됨'],
    '未啟用': ['未启用','未啟用','Disabled','無効','비활성화'],
    '就緒': ['就绪','就緒','Ready','準備完了','준비됨'],
    '顯示': ['显示','顯示','Show','表示','표시'],
    '隱藏': ['隐藏','隱藏','Hide','非表示','숨기기'],
    '來源：YouTube': ['来源：YouTube','來源：YouTube','Source: YouTube','ソース：YouTube','소스: YouTube'],
    '來源：YouTube (直播)': ['来源：YouTube（直播）','來源：YouTube（直播）','Source: YouTube (live)','ソース：YouTube（ライブ）','소스: YouTube (라이브)'],
    '來源：YouTube Music': ['来源：YouTube Music','來源：YouTube Music','Source: YouTube Music','ソース：YouTube Music','소스: YouTube Music'],
    '來源：Spotify': ['来源：Spotify','來源：Spotify','Source: Spotify','ソース：Spotify','소스: Spotify'],
    '來源：SoundCloud': ['来源：SoundCloud','來源：SoundCloud','Source: SoundCloud','ソース：SoundCloud','소스: SoundCloud'],
    '來源：Twitch (直播)': ['来源：Twitch（直播）','來源：Twitch（直播）','Source: Twitch (live)','ソース：Twitch（ライブ）','소스: Twitch (라이브)'],
    '來源：Twitch (記錄檔)': ['来源：Twitch（录像）','來源：Twitch（記錄檔）','Source: Twitch (VOD)','ソース：Twitch（録画）','소스: Twitch (VOD)'],
    'Twitch 直播': ['Twitch 直播','Twitch 直播','Twitch live','Twitch ライブ','Twitch 라이브'],
    'Twitch 記錄檔': ['Twitch 录像','Twitch 記錄檔','Twitch VOD','Twitch 録画','Twitch VOD'],
    'YouTube 直播': ['YouTube 直播','YouTube 直播','YouTube live','YouTube ライブ','YouTube 라이브'],
    '媒體': ['媒体','媒體','Media','メディア','미디어'],
    '觀眾': ['观众','觀眾','Viewer','視聴者','시청자'],
    'Twitch 機器人 (&gt;np)': ['Twitch 机器人 (&gt;np)','Twitch 機械人 (&gt;np)','Twitch bot (&gt;np)','Twitch ボット (&gt;np)','Twitch 봇 (&gt;np)'],
    'Twitch 機器人 (>np)': ['Twitch 机器人 (>np)','Twitch 機械人 (>np)','Twitch bot (>np)','Twitch ボット (>np)','Twitch 봇 (>np)'],
    'TWITCH 機器人 (&gt;np)': ['TWITCH 机器人 (&gt;np)','TWITCH 機械人 (&gt;np)','TWITCH bot (&gt;np)','TWITCH ボット (&gt;np)','TWITCH 봇 (&gt;np)'],
    'TWITCH 機器人 (>np)': ['TWITCH 机器人 (>np)','TWITCH 機械人 (>np)','TWITCH bot (>np)','TWITCH ボット (>np)','TWITCH 봇 (>np)'],
    '設定 →': ['设置 →','設定 →','Settings →','設定 →','설정 →'],
    '發送測試訊息': ['发送测试消息','發送測試訊息','Send test message','テストメッセージを送信','테스트 메시지 보내기'],
    '點擊': ['点击','撳','Click','',''],
    'Twitch 帳號綁定與機器人設定': ['Twitch 账号绑定与机器人设置','Twitch 帳戶綁定同機械人設定','Twitch account and bot settings','Twitch アカウントとボット設定','Twitch 계정 및 봇 설정'],
    '啟用 Twitch 聊天室': ['启用 Twitch 聊天室','啟用 Twitch 聊天室','Enable Twitch chat','Twitch チャットを有効化','Twitch 채팅 활성화'],
    '指令回應': ['指令回复','指令回覆','command replies','コマンド応答','명령 응답'],
    '實況頻道名稱 (Channel)': ['直播频道名称 (Channel)','直播頻道名稱 (Channel)','Stream channel (Channel)','配信チャンネル (Channel)','방송 채널 (Channel)'],
    '例如: shroud 或您的 Twitch 帳號': ['例如：shroud 或您的 Twitch 账号','例如：shroud 或你嘅 Twitch 帳戶','e.g. shroud or your Twitch account','例：shroud または Twitch アカウント','예: shroud 또는 Twitch 계정'],
    '機器人將進駐並監聽此頻道的聊天室。': ['机器人将在此频道的聊天室中运行。','機械人會加入並監聽呢個頻道嘅聊天室。','The bot will join and monitor this channel’s chat.','ボットがこのチャンネルのチャットに参加します。','봇이 이 채널의 채팅에 참여합니다.'],
    '發言帳號 (Bot Username)': ['发言账号 (Bot Username)','發言帳戶 (Bot Username)','Bot account (Bot Username)','ボットのアカウント (Bot Username)','봇 계정 (Bot Username)'],
    '選填，留空則以實況主本人帳號發言': ['选填，留空则使用主播账号发言','選填，留空就用實況主本人帳戶發言','Optional; blank uses the streamer account','省略可。空欄の場合は配信者のアカウントを使用','선택 사항. 비우면 방송인 계정을 사용'],
    '可輸入專屬小帳（如 xxx_bot），留空預設為本尊。': ['可输入专用小号（如 xxx_bot），留空默认使用本人账号。','可以輸入專用小帳（例如 xxx_bot），留空就用本人帳戶。','Use a separate bot account such as xxx_bot, or leave blank for your own account.','xxx_bot などの専用アカウントを入力できます。空欄なら本人のアカウントを使用します。','xxx_bot 같은 별도 봇 계정을 입력할 수 있습니다. 비우면 본인 계정을 사용합니다.'],
    '點此快速取得 Token (免申請 App) ↗': ['点击快速获取 Token（无需申请 App）↗','撳呢度快速攞 Token（毋須申請 App）↗','Get a Token quickly (no app required) ↗','Token を取得（アプリ申請不要）↗','Token 빠르게 받기 (앱 신청 불필요) ↗'],
    '安全保證：Token 僅保存在本機伺服器中，僅具備聊天室發送權限（': ['安全保证：Token 仅保存在本地服务器中，仅具备聊天室发送权限（','安全保證：Token 只儲存喺本機伺服器，只具備聊天室發送權限（','Security: the Token stays on your local server and has only chat permissions (','セキュリティ：Token はローカルサーバーにのみ保存され、チャット権限のみを持ちます（','보안: Token은 로컬 서버에만 저장되며 채팅 권한만 가집니다('],
    '），絕不上傳外部伺服器。': ['），绝不上传到外部服务器。','），絕不會上傳去外部伺服器。','). It is never uploaded to an external server.','). 外部サーバーには送信されません.','). 외부 서버로 업로드되지 않습니다.'],
    '自訂觸發指令': ['自定义触发指令','自訂觸發指令','Custom trigger command','カスタム起動コマンド','사용자 지정 호출 명령'],
    '預設同時相容': ['默认同时兼容','預設同時支援','Also supports','既定で対応：','기본 지원:'],
    '與': ['与','同','and','と','및'],
    '指令冷卻時間 (秒)': ['指令冷却时间（秒）','指令冷卻時間（秒）','Command cooldown (seconds)','コマンドの待機時間（秒）','명령 대기 시간(초)'],
    '避免聊天室觀眾密集洗版，建議 3~10 秒。': ['避免观众频繁刷屏，建议设置 3~10 秒。','避免觀眾洗版，建議設 3~10 秒。','To prevent chat spam, use 3–10 seconds.','チャットの連投を防ぐため、3～10 秒を推奨します。','채팅 도배 방지를 위해 3~10초를 권장합니다.'],
    '儲存設定並連線': ['保存设置并连接','儲存設定並連線','Save and connect','保存して接続','저장하고 연결'],
    '在聊天室發送測試訊息': ['在聊天室发送测试消息','喺聊天室發送測試訊息','Send test message in chat','チャットにテストメッセージを送信','채팅에 테스트 메시지 보내기'],
    '聊天室回覆即時預覽': ['聊天室回复实时预览','聊天室回覆即時預覽','Live chat reply preview','チャット返信プレビュー','채팅 응답 미리보기'],
    '已回覆指令次數': ['已回复指令次数','已回覆指令次數','Commands answered','応答したコマンド数','응답한 명령 수'],
    '目前進駐頻道': ['当前加入的频道','而家加入嘅頻道','Current channel','参加中のチャンネル','현재 채널'],
    '新手教學指引：': ['新手教程：','新手教學：','Getting started:','初めての方へ：','시작하기:'],
    '點擊左側': ['点击左侧','撳左邊','Click','左側の','왼쪽의'],
    '「點此快速取得 Token」': ['“点击快速获取 Token”','「點此快速攞 Token」','“Get a Token quickly”','「Token を取得」','“Token 빠르게 받기”'],
    '，登入您要用來發言的 Twitch 帳號授權。': ['，登录您要用来发言的 Twitch 账号并授权。','，登入要用嚟發言嘅 Twitch 帳戶授權。',', then authorize the Twitch account that will send messages.','をクリックし、発言に使用する Twitch アカウントを認証します。','을 클릭하고 메시지를 보낼 Twitch 계정을 인증하세요.'],
    '複製產生的 Token 貼入左側欄位，填寫實況頻道名稱並勾選': ['复制 Token 到左侧栏位，填写直播频道并勾选','複製 Token 去左邊欄位，填直播頻道名稱並剔選','Paste the Token, enter the channel name, and select','Token を貼り付け、チャンネル名を入力して','Token을 붙여넣고 채널 이름을 입력한 뒤'],
    '「啟用」': ['“启用”','「啟用」','“Enable”','「有効化」を選択します','“활성화”를 선택하세요.'],
    '。': ['。','。','.','。',''],
    '、': ['、','、',', ','、',', '],
    '「儲存設定並連線」': ['“保存设置并连接”','「儲存設定並連線」','“Save and connect”','「保存して接続」','“저장하고 연결”'],
    '，右上狀態顯示為綠燈即表示機器人已在聊天室就緒！': ['，右上状态显示绿灯表示机器人已在聊天室就绪！','，右上角顯示綠燈就代表機械人已經準備好！',', then wait for the green status light to confirm the bot is ready.','をクリックし、右上の状態が緑になれば準備完了です。','을 클릭하세요. 오른쪽 위 표시가 녹색이면 봇이 준비된 것입니다.'],
    '觀眾在聊天室輸入': ['观众在聊天室输入','觀眾喺聊天室輸入','Viewers can type','視聴者がチャットで','시청자가 채팅에'],
    '或': ['或','或者','or','または','또는'],
    '，即可即時收到目前歌曲與連結。': ['，即可立即收到当前歌曲与链接。','，就可以即時收到而家嘅歌曲同連結。','to get the current song and link.','と入力すると、現在の曲とリンクが表示されます。','을 입력하면 현재 노래와 링크를 받을 수 있습니다.'],
    '[Spotify] 載入播放資訊中...': ['[Spotify] 正在加载播放信息...','[Spotify] 載入播放資料中...','[Spotify] Loading playback info...','[Spotify] 再生情報を読み込み中...','[Spotify] 재생 정보 불러오는 중...'],
    'Twitch: 未連線': ['Twitch：未连接','Twitch：未連線','Twitch: Disconnected','Twitch：未接続','Twitch: 연결 안 됨'],
    'Twitch: 連線中...': ['Twitch：连接中...','Twitch：連線中...','Twitch: Connecting...','Twitch：接続中...','Twitch: 연결 중...'],
    'Twitch: 連線失敗': ['Twitch：连接失败','Twitch：連線失敗','Twitch: Connection failed','Twitch：接続失敗','Twitch: 연결 실패'],
    'Twitch: 伺服器未連線': ['Twitch：服务器未连接','Twitch：伺服器未連線','Twitch: Server disconnected','Twitch：サーバー未接続','Twitch: 서버 연결 끊김'],
    '點擊切換至 Twitch 機器人設定': ['点击切换到 Twitch 机器人设置','撳呢度切換去 Twitch 機械人設定','Open Twitch bot settings','Twitch ボット設定を開く','Twitch 봇 설정 열기'],
    '請輸入實況頻道名稱與 Twitch OAuth Token': ['请输入直播频道名称与 Twitch OAuth Token','請輸入直播頻道名稱同 Twitch OAuth Token','Enter a stream channel and Twitch OAuth Token','配信チャンネル名と Twitch OAuth Token を入力','방송 채널과 Twitch OAuth Token을 입력하세요'],
    'Twitch 機器人設定已儲存並重新連線': ['Twitch 机器人设置已保存并重新连接','Twitch 機械人設定已儲存並重新連線','Twitch bot settings saved and reconnected','Twitch ボット設定を保存して再接続しました','Twitch 봇 설정 저장 및 재연결 완료'],
    '儲存失敗': ['保存失败','儲存失敗','Save failed','保存に失敗しました','저장 실패'],
    '測試訊息已送出': ['测试消息已发送','測試訊息已發出','Test message sent','テストメッセージを送信しました','테스트 메시지 전송됨'],
    '發送失敗，請檢查連線狀態': ['发送失败，请检查连接状态','發送失敗，請檢查連線狀態','Send failed; check the connection','送信に失敗しました。接続を確認してください','전송 실패. 연결 상태를 확인하세요'],
    '請先填寫頻道名稱與 Token 後再啟用': ['请先填写频道名称与 Token 后再启用','請先填頻道名稱同 Token 再啟用','Enter the channel and Token before enabling','有効化する前にチャンネル名と Token を入力','활성화하기 전에 채널과 Token을 입력하세요'],
    '已複製 CSS，貼入 OBS 自訂 CSS 欄位即生效': ['CSS 已复制，粘贴到 OBS 自定义 CSS 栏即可生效','CSS 已複製，貼去 OBS 自訂 CSS 欄位就得','CSS copied. Paste it into OBS Custom CSS.','CSS をコピーしました。OBS のカスタム CSS に貼り付けてください。','CSS를 복사했습니다. OBS 사용자 지정 CSS에 붙여넣으세요.'],
    '已複製 OBS 網址：': ['已复制 OBS 网址：','已複製 OBS 網址：','OBS URL copied: ','OBS URL をコピーしました：','OBS URL 복사됨: '],
    '設定儲存錯誤: ': ['保存设置出错：','儲存設定出錯：','Error saving settings: ','設定の保存エラー：','설정 저장 오류: '],
    '測試發送錯誤: ': ['测试发送出错：','測試發送出錯：','Test send error: ','テスト送信エラー：','테스트 전송 오류: '],
    '正常（': ['正常（','正常（','Online (','正常（','정상 ('],
    ' 個客戶端）': [' 个客户端）',' 個客戶端）',' clients)',' クライアント）',' 클라이언트)'],
    ' 連線）': [' 个连接）',' 個連線）',' connections)',' 接続）',' 연결)'],
    '已抓取 ': ['已获取 ','已擷取 ','Received ','取得済み：','수신됨: '],
    ' 數據': [' 数据',' 資料',' data',' データ',' 데이터'],
    ' 已連線': [' 已连接',' 已連線',' connected',' 接続済み',' 연결됨'],
    '已連線: #': ['已连接：#','已連線：#','Connected: #','接続済み：#','연결됨: #'],
    '已連線 (#': ['已连接 (#','已連線 (#','Connected (#','接続済み（#','연결됨 (#'],
    ' 觀眾': [' 位观众',' 位觀眾',' viewers',' 人が視聴中','명 시청 중']
  };

  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  let language;
  let index;
  let observer;

  function normalize(value) {
    if (languages.includes(value)) return value;
    const lower = String(value || '').toLowerCase();
    if (lower.startsWith('zh-hk') || lower.startsWith('yue')) return 'zh-HK';
    if (lower.startsWith('zh-cn') || lower.startsWith('zh-sg')) return 'zh-CN';
    if (lower.startsWith('zh')) return 'zh-TW';
    if (lower.startsWith('ja')) return 'ja-JP';
    if (lower.startsWith('ko')) return 'ko-KR';
    return 'en-US';
  }
  function initialLanguage() {
    const requested = new URLSearchParams(location.search).get('lang');
    let saved;
    try { saved = localStorage.getItem('music-overlay-language'); } catch (_) {}
    return normalize(requested || saved || navigator.language);
  }
  function translate(source) {
    if (index === 0) return source;
    if (rows[source]) return rows[source][index - 1];
    const patterns = [
      [/^伺服器正常（(.+) 連線）$/, m => [source, `服务器正常（${m[1]} 个连接）`, `伺服器正常（${m[1]} 個連線）`, `Server online (${m[1]} connection${m[1] === '1' ? '' : 's'})`, `サーバー正常（${m[1]} 接続）`, `서버 정상 (${m[1]}개 연결)`][index]],
      [/^正常（(.+) 個客戶端）$/, m => [source, `正常（${m[1]} 个客户端）`, `正常（${m[1]} 個客戶端）`, `Online (${m[1]} client${m[1] === '1' ? '' : 's'})`, `正常（${m[1]} クライアント）`, `정상 (${m[1]}개 클라이언트)`][index]],
      [/^已抓取 (.+) 數據$/, m => translate('已抓取 ') + translate(m[1]) + translate(' 數據')],
      [/^Twitch: #(.+) 已連線$/, m => 'Twitch: #' + m[1] + translate(' 已連線')],
      [/^已連線: #(.+)$/, m => translate('已連線: #') + m[1]],
      [/^已連線 \(#(.+)\)$/, m => translate('已連線 (#') + m[1] + (language === 'ja-JP' ? '）' : ')')],
      [/^(.+) 觀眾$/, m => m[1] + translate(' 觀眾')],
      [/^已複製 OBS 網址：(.+)$/, m => translate('已複製 OBS 網址：') + m[1]],
      [/^設定儲存錯誤: (.+)$/, m => translate('設定儲存錯誤: ') + m[1]],
      [/^測試發送錯誤: (.+)$/, m => translate('測試發送錯誤: ') + m[1]]
    ];
    for (const [pattern, build] of patterns) {
      const match = source.match(pattern);
      if (match) return build(match);
    }
    return source;
  }
  function translatableText(node) {
    if (!node.parentElement || node.parentElement.closest('script, style, textarea, code, pre, [contenteditable="true"]')) return false;
    return true;
  }
  function translateText(source) {
    return source.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, left, body, right) => left + translate(body) + right);
  }
  function updateText(node, force = false) {
    if (!translatableText(node)) return;
    const current = node.nodeValue;
    const previous = textSources.get(node);
    const source = force && previous !== undefined ? previous : (previous !== undefined && current === translateText(previous) ? previous : current);
    textSources.set(node, source);
    const result = translateText(source);
    if (result !== current) node.nodeValue = result;
  }
  function updateAttributes(element, force = false) {
    if (element.closest('script, style, [contenteditable="true"]')) return;
    const sources = attributeSources.get(element) || {};
    for (const name of ['title', 'placeholder', 'alt', 'aria-label']) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      const source = force && sources[name] !== undefined ? sources[name] : (sources[name] !== undefined && current === translate(sources[name]) ? sources[name] : current);
      sources[name] = source;
      const result = translate(source);
      if (result !== current) element.setAttribute(name, result);
    }
    attributeSources.set(element, sources);
  }
  function visit(root, force = false) {
    if (root.nodeType === Node.TEXT_NODE) { updateText(root, force); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    updateAttributes(root, force);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) updateText(walker.currentNode, force);
      else updateAttributes(walker.currentNode, force);
    }
  }
  function setLanguage(value, save = true) {
    language = normalize(value);
    index = languages.indexOf(language);
    document.documentElement.lang = language;
    if (save) {
      try { localStorage.setItem('music-overlay-language', language); } catch (_) {}
      if (document.getElementById('music-language') && location.search.includes('lang=')) {
        const url = new URL(location.href);
        url.searchParams.set('lang', language);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    }
    if (document.body) visit(document.body, true);
    document.title = translate('中控台 — Music Player Overlay') === '中控台 — Music Player Overlay'
      ? document.title.replace(/^.* — Music Player Overlay$/, '中控台 — Music Player Overlay')
      : document.title.replace(/^.* — Music Player Overlay$/, translate('中控台 — Music Player Overlay'));
    const select = document.getElementById('music-language');
    if (select) select.value = language;
    window.dispatchEvent(new CustomEvent('music-language-change', { detail: language }));
  }
  function addSelector() {
    const target = document.querySelector('.header-status') || document.querySelector('.header');
    if (!target || document.getElementById('music-language')) return;
    const select = document.createElement('select');
    select.id = 'music-language';
    select.setAttribute('aria-label', 'Language');
    select.title = 'Language / 語言';
    select.style.cssText = 'width:auto;max-width:142px;min-width:88px;flex:0 0 auto;padding:5px 22px 5px 8px;border:1px solid #3a4564;border-radius:7px;background-color:#161927;color:#e8ecf8;font:12px sans-serif;cursor:pointer';
    languages.forEach((code, i) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = names[i];
      select.appendChild(option);
    });
    if (target.classList.contains('header-status')) target.insertBefore(select, target.lastElementChild);
    else target.insertBefore(select, target.lastElementChild);
    select.addEventListener('change', () => setLanguage(select.value));
    select.value = language;
  }
  language = initialLanguage();
  index = languages.indexOf(language);
  window.MusicI18n = { get language() { return language; }, setLanguage, translate };
  document.addEventListener('DOMContentLoaded', () => {
    addSelector();
    setLanguage(language, false);
    observer = new MutationObserver(changes => {
      for (const change of changes) {
        if (change.type === 'characterData') updateText(change.target);
        else if (change.type === 'attributes') updateAttributes(change.target);
        else for (const node of change.addedNodes) visit(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'alt', 'aria-label'] });
  });
  window.addEventListener('storage', event => {
    if (event.key === 'music-overlay-language' && event.newValue) setLanguage(event.newValue, false);
  });
})();
