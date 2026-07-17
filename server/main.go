package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

var db *sql.DB

// Character represents an AI roleplay character
type Character struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Avatar       string    `json:"avatar"`
	Cover        string    `json:"cover,omitempty"`
	CreatorNotes string    `json:"creatorNotes"`
	Tags         []string  `json:"tags"`
	Likes        int64     `json:"likes"`
	DateAdded    float64   `json:"dateAdded"`
	Featured     bool      `json:"featured"`
}

// APIResponse wraps list responses
type APIResponse struct {
	Total    int         `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"pageSize"`
	Data     interface{} `json:"data"`
}

type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar,omitempty"`
	Balance  int    `json:"balance"`
	VIP      bool   `json:"vip"`
}

type Comment struct {
	ID            int64     `json:"id"`
	Content       string    `json:"content"`
	CharacterName string    `json:"characterName"`
	Author        string    `json:"author"`
	IsReply       bool      `json:"isReply"`
	CreatedAt     time.Time `json:"createdAt"`
}

func main() {
	var err error
	dbPath := "aiharem.db"
	if envPath := os.Getenv("DB_PATH"); envPath != "" {
		dbPath = envPath
	}

	db, err = sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	db.SetMaxOpenConns(1)

	if err := initDB(); err != nil {
		log.Fatal(err)
	}

	importSeedData()

	mux := http.NewServeMux()
	handler := corsMiddleware(mux)

	mux.HandleFunc("/img/", handleImgProxy)
	mux.HandleFunc("/api/portal/public/bootstrap", handleBootstrap)
	mux.HandleFunc("/api/portal/public/characters", handleCharacters)
	mux.HandleFunc("/api/portal/public/characters/featured", handleFeaturedCharacters)
	mux.HandleFunc("/api/portal/public/tags", handleTags)
	mux.HandleFunc("/api/portal/public/comments/hot", handleHotComments)
	mux.HandleFunc("/api/chat/", handleChat)

	spaHandler := serveSPA(http.FileServer(http.Dir("../web/dist")))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/chat/") || strings.HasPrefix(r.URL.Path, "/img/") {
			http.NotFound(w, r)
			return
		}
		spaHandler(w, r)
	})

	port := "8989"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}

	log.Printf("AI后宫 server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(200)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func initDB() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS characters (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			avatar TEXT DEFAULT '',
			cover TEXT DEFAULT '',
			creator_notes TEXT DEFAULT '',
			likes INTEGER DEFAULT 0,
			featured INTEGER DEFAULT 0,
			date_added REAL DEFAULT (cast(strftime('%s','now') as real) * 1000)
		)`,
		`CREATE TABLE IF NOT EXISTS character_tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			character_id INTEGER NOT NULL,
			tag TEXT NOT NULL,
			FOREIGN KEY(character_id) REFERENCES characters(id)
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			avatar TEXT DEFAULT '',
			balance INTEGER DEFAULT 8,
			vip INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			character_id INTEGER NOT NULL,
			content TEXT NOT NULL,
			author TEXT NOT NULL,
			is_reply INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_characters_likes ON characters(likes DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_character_tags_char ON character_tags(character_id)`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return fmt.Errorf("initDB: %w", err)
		}
	}
	return nil
}

func importSeedData() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM characters").Scan(&count)
	if count > 0 {
		log.Printf("Database already has %d characters, skipping seed import", count)
		return
	}

	data, err := os.ReadFile("seed_characters.json")
	if err != nil {
		log.Printf("No seed data file found, skipping: %v", err)
		return
	}

	type SeedChar struct {
		Name         string   `json:"name"`
		Avatar       string   `json:"avatar"`
		CreatorNotes string   `json:"creatorNotes"`
		Tags         []string `json:"tags"`
		Likes        int64    `json:"likes"`
		Featured     bool     `json:"featured"`
	}

	var seedChars []SeedChar
	if err := json.Unmarshal(data, &seedChars); err != nil {
		log.Printf("Failed to parse seed data: %v", err)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		log.Printf("Failed to begin transaction: %v", err)
		return
	}

	for i, ch := range seedChars {
		result, err := tx.Exec(
			"INSERT INTO characters (name, avatar, cover, creator_notes, likes, featured, date_added) VALUES (?, ?, ?, ?, ?, ?, ?)",
			ch.Name, ch.Avatar, "", ch.CreatorNotes, ch.Likes,
			boolToInt(ch.Featured), float64(time.Now().UnixMilli()),
		)
		if err != nil {
			continue
		}
		id, _ := result.LastInsertId()

		for _, tag := range ch.Tags {
			tx.Exec("INSERT INTO character_tags (character_id, tag) VALUES (?, ?)", id, tag)
		}

		if (i+1)%100 == 0 {
			log.Printf("Imported %d/%d characters", i+1, len(seedChars))
		}
	}

	tx.Commit()
	log.Printf("Seed import complete: %d characters", len(seedChars))
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func handleBootstrap(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, map[string]interface{}{
		"site": map[string]interface{}{
			"name": "AI后宫",
			"friendLinks": []map[string]string{
				{"name": "脱衣换脸", "url": "#", "icon": "fa-shirt"},
				{"name": "图生黄片", "url": "#", "icon": "fa-clapperboard"},
			},
		},
		"announcements": []map[string]string{
			{"text": "欢迎来到AI后宫，与你的心动角色开启专属对话～", "url": ""},
			{"text": "推广本站，赚取推广佣金！", "url": "/account?tab=referral"},
			{"text": "充值电量，选择角色聊天，还能根据聊天生成图片哦～～～", "url": "/account?tab=recharge"},
			{"text": "每日签到，幸运转盘抽取电量～", "url": "/account?tab=checkin"},
		},
		"register": map[string]interface{}{
			"enabled":      true,
			"bonusEnabled": true,
			"bonus":         8,
		},
		"checkin": map[string]interface{}{
			"enabled": true,
			"min":     1,
			"max":     10,
		},
		"referral": map[string]interface{}{
			"enabled":        true,
			"commissionRate": 38,
		},
		"user": nil,
	})
}

func handleCharacters(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	sort := r.URL.Query().Get("sort")
	search := r.URL.Query().Get("search")
	tag := r.URL.Query().Get("tag")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 24
	}

	var total int
	where := "WHERE 1=1"
	args := []interface{}{}

	if search != "" {
		where += " AND (c.name LIKE ? OR c.creator_notes LIKE ?)"
		s := "%" + search + "%"
		args = append(args, s, s)
	}
	if tag != "" {
		where += " AND c.id IN (SELECT character_id FROM character_tags WHERE tag = ?)"
		args = append(args, tag)
	}

	countQuery := "SELECT COUNT(*) FROM characters c " + where
	db.QueryRow(countQuery, args...).Scan(&total)

	orderClause := "ORDER BY c.date_added DESC"
	switch sort {
	case "hot":
		orderClause = "ORDER BY c.likes DESC"
	case "new":
		orderClause = "ORDER BY c.date_added DESC"
	}

	offset := (page - 1) * pageSize
	query := fmt.Sprintf(
		"SELECT c.id, c.name, c.avatar, c.cover, c.creator_notes, c.likes, c.featured, c.date_added FROM characters c %s %s LIMIT ? OFFSET ?",
		where, orderClause,
	)
	allArgs := append(args, pageSize, offset)

	rows, err := db.Query(query, allArgs...)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	chars := []Character{}
	for rows.Next() {
		var ch Character
		var cover sql.NullString
		var featured int
		rows.Scan(&ch.ID, &ch.Name, &ch.Avatar, &cover, &ch.CreatorNotes, &ch.Likes, &featured, &ch.DateAdded)
		ch.Cover = cover.String
		ch.Featured = featured == 1
		ch.Tags = []string{}
		chars = append(chars, ch)
	}

	batchGetTags(chars)
	fillAvatarURLs(chars)

	jsonResponse(w, APIResponse{
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		Data:     chars,
	})
}

func handleFeaturedCharacters(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 50 {
		limit = 18
	}

	rows, err := db.Query(
		"SELECT c.id, c.name, c.avatar, c.cover, c.creator_notes, c.likes, c.featured, c.date_added FROM characters c WHERE c.featured = 1 ORDER BY c.likes DESC LIMIT ?",
		limit,
	)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	chars := []Character{}
	for rows.Next() {
		var ch Character
		var cover sql.NullString
		var featured int
		rows.Scan(&ch.ID, &ch.Name, &ch.Avatar, &cover, &ch.CreatorNotes, &ch.Likes, &featured, &ch.DateAdded)
		ch.Cover = cover.String
		ch.Featured = featured == 1
		ch.Tags = []string{}
		chars = append(chars, ch)
	}

	batchGetTags(chars)

	if len(chars) == 0 {
		rows.Close()
		rows, err = db.Query(
			"SELECT c.id, c.name, c.avatar, c.cover, c.creator_notes, c.likes, c.featured, c.date_added FROM characters c ORDER BY c.likes DESC LIMIT ?",
			limit,
		)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()
		for rows.Next() {
			var ch Character
			var cover sql.NullString
			var featured int
			rows.Scan(&ch.ID, &ch.Name, &ch.Avatar, &cover, &ch.CreatorNotes, &ch.Likes, &featured, &ch.DateAdded)
			ch.Cover = cover.String
			ch.Featured = featured == 1
			ch.Tags = []string{}
			chars = append(chars, ch)
		}
		batchGetTags(chars)
	}

	fillAvatarURLs(chars)
	jsonResponse(w, map[string]interface{}{"data": chars})
}

func handleTags(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(
		"SELECT tag, COUNT(*) as cnt FROM character_tags GROUP BY tag ORDER BY cnt DESC",
	)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	type TagData struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}

	tags := []TagData{}
	for rows.Next() {
		var t TagData
		rows.Scan(&t.Name, &t.Count)
		tags = append(tags, t)
	}

	jsonResponse(w, map[string]interface{}{"data": tags})
}

func handleHotComments(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 20 {
		limit = 5
	}

	rows, err := db.Query(
		`SELECT co.id, co.content, c.name, co.author, co.is_reply, co.created_at 
		FROM comments co 
		JOIN characters c ON c.id = co.character_id 
		ORDER BY co.created_at DESC LIMIT ?`,
		limit,
	)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	comments := []Comment{}
	for rows.Next() {
		var cm Comment
		var isReply int
		rows.Scan(&cm.ID, &cm.Content, &cm.CharacterName, &cm.Author, &isReply, &cm.CreatedAt)
		cm.IsReply = isReply == 1
		comments = append(comments, cm)
	}

	jsonResponse(w, map[string]interface{}{"data": comments})
}

func handleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		CharacterID int64  `json:"characterId"`
		Message     string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	var charName, charNotes string
	db.QueryRow("SELECT name, creator_notes FROM characters WHERE id = ?", req.CharacterID).
		Scan(&charName, &charNotes)

	response := generateMockResponse(charName, charNotes, req.Message)

	jsonResponse(w, map[string]interface{}{
		"reply":         response,
		"characterName": charName,
	})
}

func generateMockResponse(charName, charNotes, message string) string {
	responses := []string{
		fmt.Sprintf("（%s 轻轻靠近你，眼神中带着一丝玩味）嗯...你说的倒是有点意思。", charName),
		fmt.Sprintf("（%s 微微蹙眉）你这样说话，让我很难办啊...不过，我喜欢。", charName),
		fmt.Sprintf("（%s 嘴角扬起一抹笑意）呵，你比我想象中的更有趣呢。", charName),
		fmt.Sprintf("（%s 用手指轻轻点着下巴思考）让我想想...你觉得这样真的好吗？", charName),
		fmt.Sprintf("（%s 眼中闪过一丝狡黠）那你打算怎么补偿我呢？", charName),
	}
	return responses[time.Now().UnixNano()%int64(len(responses))]
}

func batchGetTags(chars []Character) {
	if len(chars) == 0 {
		return
	}
	idToIdx := make(map[int64]int)
	ids := make([]interface{}, 0, len(chars))
	for i, ch := range chars {
		idToIdx[ch.ID] = i
		ids = append(ids, ch.ID)
	}

	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(ids)), ",")
	query := "SELECT character_id, tag FROM character_tags WHERE character_id IN (" + placeholders + ")"
	rows, err := db.Query(query, ids...)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var charID int64
		var tag string
		rows.Scan(&charID, &tag)
		if idx, ok := idToIdx[charID]; ok {
			chars[idx].Tags = append(chars[idx].Tags, tag)
		}
	}
}

func jsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	json.NewEncoder(w).Encode(data)
}

const imgBaseURL = "https://aihougong1.com/thumbnail/post?type=post&file="

func avatarURL(filename string) string {
	if filename == "" {
		return ""
	}
	return "/img/" + url.QueryEscape(filename)
}

func handleImgProxy(w http.ResponseWriter, r *http.Request) {
	filename := strings.TrimPrefix(r.URL.Path, "/img/")
	if filename == "" {
		http.Error(w, "missing filename", 400)
		return
	}
	targetURL := imgBaseURL + filename
	resp, err := http.Get(targetURL)
	if err != nil {
		http.Error(w, "image fetch failed", 502)
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.Header().Set("Cache-Control", "public, max-age=86400")
	io.Copy(w, resp.Body)
}

func fillAvatarURLs(chars []Character) {
	for i := range chars {
		if chars[i].Avatar != "" {
			chars[i].Avatar = avatarURL(chars[i].Avatar)
		}
	}
}

func serveSPA(fs http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := "../web/dist" + r.URL.Path
		if _, err := os.Stat(path); err == nil && !strings.HasPrefix(r.URL.Path, "/api/") {
			fs.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, "../web/dist/index.html")
	}
}
