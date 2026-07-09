// Lưu & đọc lịch sử ván đấu (localStorage), và chia sẻ ván đấu qua đường link
// (mã hóa base64url nhúng vào URL, không cần server lưu trữ).
// CHỈ dùng được ở phía trình duyệt (client component/hook).
//
// LƯU Ý: phần giao diện popup "Chia sẻ ván cờ" của bản app cũ (vẽ DOM bằng tay)
// KHÔNG được chuyển sang đây, vì đó là việc của component React, không phải của
// module dữ liệu thuần này. Nếu bạn cần popup chia sẻ, nói mình làm 1 component
// React riêng dùng các hàm encode/decode/buildShareUrl bên dưới.

export interface StoredGame {
  id: string
  gameKey: 'chess'

  /** Danh sách nước đi dạng UCI, ví dụ ["e2e4", "e7e5", ...] */
  moves: string[]
  result: 'win' | 'loss' | 'draw' | 'abandoned' | ''
  userColor: 'white' | 'black'
  vsEngine: boolean
  level?: number
  startedAt: number
  endedAt?: number
  moveCount: number
  imported?: boolean
}

const STORAGE_KEY = 'chessone.chess.history.v1'
const GAME_KEY = 'chess'
const MAX_GAMES = 10
const SHARE_VERSION = 1

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function loadAll(): StoredGame[] {
  if (!hasLocalStorage()) return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('[history] lỗi đọc storage:', e)

    return []
  }
}

function saveAll(games: StoredGame[]): boolean {
  if (!hasLocalStorage()) return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))

    return true
  } catch (e) {
    console.warn('[history] lỗi ghi storage (có thể vượt quota):', e)

    return false
  }
}

/** Lưu 1 ván đấu (thêm mới, hoặc cập nhật nếu trùng id). Tự động chỉ giữ lại 10 ván gần nhất. */
export function saveGame(game: StoredGame): boolean {
  if (!game || !game.id) {
    console.error('[history] game thiếu id')

    return false
  }

  let games = loadAll()
  const idx = games.findIndex(g => g.id === game.id)

  if (idx >= 0) games[idx] = game
  else games.unshift(game)
  if (games.length > MAX_GAMES) games = games.slice(0, MAX_GAMES)

  return saveAll(games)
}

export function listGames(): StoredGame[] {
  return loadAll()
}

export function getGame(id: string): StoredGame | null {
  return loadAll().find(g => g.id === id) || null
}

export function deleteGame(id: string): boolean {
  return saveAll(loadAll().filter(g => g.id !== id))
}

export function clearHistory(): boolean {
  if (!hasLocalStorage()) return false

  try {
    localStorage.removeItem(STORAGE_KEY)

    return true
  } catch {
    return false
  }
}

/** Tạo id duy nhất cho 1 ván đấu mới */
export function createGameId(): string {
  return String(Date.now()) + '_' + Math.floor(Math.random() * 1000)
}

// ================= CHIA SẺ VÁN ĐẤU QUA LINK =================

interface SharePayload {
  v: number
  k: string
  g: Omit<StoredGame, 'id'>
}

function buildSharePayloadGame(game: StoredGame): Omit<StoredGame, 'id'> {
  const { id: _id, ...rest } = game

  return rest
}

function b64urlEncode(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)))

  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')

  while (b64.length % 4) b64 += '='

  return decodeURIComponent(escape(atob(b64)))
}

/** Mã hóa 1 ván đấu thành chuỗi để nhúng vào URL, dùng cùng với buildShareUrl() */
export function encodeGame(game: StoredGame): string {
  const payload: SharePayload = { v: SHARE_VERSION, k: GAME_KEY, g: buildSharePayloadGame(game) }

  return b64urlEncode(JSON.stringify(payload))
}

/** Giải mã chuỗi lấy từ URL thành dữ liệu ván đấu. Trả về null nếu hỏng hoặc không đúng loại cờ. */
export function decodeGame(token: string): Omit<StoredGame, 'id'> | null {
  try {
    const payload = JSON.parse(b64urlDecode(token)) as SharePayload

    if (!payload || payload.k !== GAME_KEY || !payload.g) return null
    if (!Array.isArray(payload.g.moves)) return null

    return payload.g
  } catch (e) {
    console.warn('[share] không giải mã được link:', e)

    return null
  }
}

/** Tạo đường link chia sẻ đầy đủ cho 1 ván đấu, dựa trên URL hiện tại của trang */
export function buildShareUrl(game: StoredGame): string {
  const base = location.origin + location.pathname + location.search

  return base + '#g=' + encodeGame(game)
}

/** Đọc ván đấu được chia sẻ từ URL hiện tại (nếu có trong hash "#g=..."), trả về null nếu không có */
export function parseShareFromUrl(): Omit<StoredGame, 'id'> | null {
  const h = location.hash || ''
  const m = h.match(/[#&]g=([^&]+)/)

  if (!m) return null

  return decodeGame(m[1])
}

/** Xóa tham số chia sẻ khỏi URL mà không load lại trang */
export function clearShareFromUrl(): void {
  try {
    history.replaceState(null, '', location.origin + location.pathname + location.search)
  } catch {
    try {
      location.hash = ''
    } catch {
      /* bỏ qua nếu trình duyệt không cho sửa */
    }
  }
}

/**
 * Lưu ván đấu được chia sẻ vào lịch sử của người nhận link.
 * Nếu người nhận đã từng mở đúng link này trước đó, dùng lại bản ghi cũ thay vì lưu trùng.
 */
export function importShared(game: Omit<StoredGame, 'id'> | null): StoredGame | null {
  if (!game) return null
  let g: StoredGame

  try {
    g = { ...(JSON.parse(JSON.stringify(game)) as Omit<StoredGame, 'id'>), id: '' }
  } catch {
    return null
  }

  const fingerprint = JSON.stringify(g.moves || []) + '|' + (g.result || '') + '|' + (g.startedAt || '')

  const existing = loadAll()

  for (const e of existing) {
    const efp = JSON.stringify(e.moves || []) + '|' + (e.result || '') + '|' + (e.startedAt || '')

    if (efp === fingerprint) return e // đã có sẵn, dùng lại thay vì lưu trùng
  }

  g.id = createGameId() + '_s'
  g.imported = true
  if (!g.result) g.result = 'abandoned'
  saveGame(g)

  return g
}
