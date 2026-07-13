// Thống kê người chơi CỜ CARO: Elo, số ván thắng/thua/hòa, độ chính xác trung bình.
// Giống lib/chess/user-stats.ts nhưng dùng khóa lưu trữ riêng để Elo các loại cờ
// độc lập với nhau. CHỈ dùng được ở phía trình duyệt.

export interface GmUserStats {
  elo: number
  totalGames: number
  wins: number
  losses: number
  draws: number
  accuracySum: number
  accuracyCount: number
  bestElo: number
  updatedAt: number
}

export type GmGameResultForStats = 'win' | 'loss' | 'draw'

const STORAGE_KEY = 'chessone.gomoku.userstats.v1'

/** Elo "giả định" ứng với từng cấp độ máy (1 = yếu nhất, 10 = mạnh nhất) */
export const LEVEL_ELO: Record<number, number> = {
  1: 800,
  2: 1000,
  3: 1200,
  4: 1400,
  5: 1600,
  6: 1800,
  7: 2000,
  8: 2200,
  9: 2400,
  10: 2600
}

/** Tên gọi Hán-Việt cho từng cấp độ máy */
export const LEVEL_LABELS: Record<number, string> = {
  1: 'Nhập Môn',
  2: 'Kỳ Đồng',
  3: 'Kỳ Hữu',
  4: 'Kỳ Khách',
  5: 'Kỳ Sĩ',
  6: 'Kỳ Bá',
  7: 'Kỳ Tướng',
  8: 'Quốc Thủ',
  9: 'Kỳ Vương',
  10: 'Kỳ Thánh'
}

const DEFAULT_STATS: GmUserStats = {
  elo: 1200,
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  accuracySum: 0,
  accuracyCount: 0,
  bestElo: 1200,
  updatedAt: 0
}

const K_FACTOR = 32
const ELO_MIN = 100

type StatsListener = (stats: GmUserStats) => void
const listeners: StatsListener[] = []

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function loadStats(): GmUserStats {
  if (!hasLocalStorage()) return { ...DEFAULT_STATS }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) return { ...DEFAULT_STATS }
    const data = JSON.parse(raw)

    return { ...DEFAULT_STATS, ...data }
  } catch (e) {
    console.warn('[gm-stats] lỗi đọc storage:', e)

    return { ...DEFAULT_STATS }
  }
}

function saveStats(stats: GmUserStats): boolean {
  if (!hasLocalStorage()) return false

  try {
    stats.updatedAt = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))

    return true
  } catch (e) {
    console.warn('[gm-stats] lỗi ghi storage:', e)

    return false
  }
}

function notify(): void {
  const stats = loadStats()

  listeners.forEach(fn => {
    try {
      fn(stats)
    } catch (e) {
      console.error(e)
    }
  })
}

/** Ước lượng độ chính xác 1 nước đi (0-100) từ mức tổn thất centipawn so với nước tốt nhất */
export function accuracyFromCpLoss(cpLoss: number | null | undefined): number | null {
  if (cpLoss == null || Number.isNaN(cpLoss)) return null
  if (cpLoss <= 0) return 100
  if (cpLoss >= 10000) return 0
  let acc = 103.1668 * Math.exp(-0.04354 * cpLoss) - 3.1669

  if (acc > 100) acc = 100
  if (acc < 0) acc = 0

  return acc
}

/** Công thức Elo chuẩn (hệ số K=32), có chặn dưới ELO_MIN */
export function computeNewElo(playerElo: number, opponentElo: number, score: 0 | 0.5 | 1): number {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
  let newElo = Math.round(playerElo + K_FACTOR * (score - expected))

  if (newElo < ELO_MIN) newElo = ELO_MIN

  return newElo
}

export function getStats(): GmUserStats {
  return loadStats()
}

export function getAverageAccuracy(): number | null {
  const s = loadStats()

  if (s.accuracyCount === 0) return null

  return s.accuracySum / s.accuracyCount
}

/** Cập nhật Elo + số ván thắng/thua/hòa sau khi 1 ván đấu với máy kết thúc */
export function addGameResult(
  level: number,
  result: GmGameResultForStats
): { oldElo: number; newElo: number; delta: number } {
  const opponentElo = LEVEL_ELO[level] || 1600
  const stats = loadStats()
  const oldElo = stats.elo
  const score: 0 | 0.5 | 1 = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
  const newElo = computeNewElo(oldElo, opponentElo, score)

  stats.elo = newElo
  stats.totalGames += 1
  if (result === 'win') stats.wins += 1
  if (result === 'loss') stats.losses += 1
  if (result === 'draw') stats.draws += 1
  if (newElo > stats.bestElo) stats.bestElo = newElo
  saveStats(stats)
  notify()

  return { oldElo, newElo, delta: newElo - oldElo }
}

/** Ghi nhận độ chính xác của 1 nước đi (dành cho tính năng phân tích trong tương lai) */
export function addMoveAccuracy(accuracy: number): void {
  if (accuracy == null || Number.isNaN(accuracy)) return
  const clamped = Math.max(0, Math.min(100, accuracy))
  const stats = loadStats()

  stats.accuracySum += clamped
  stats.accuracyCount += 1
  saveStats(stats)
  notify()
}

export function resetStats(): boolean {
  if (!hasLocalStorage()) return false

  try {
    localStorage.removeItem(STORAGE_KEY)
    notify()

    return true
  } catch {
    return false
  }
}

/** Đăng ký callback được gọi mỗi khi stats thay đổi */
export function onStatsChange(fn: StatsListener): void {
  listeners.push(fn)
}
