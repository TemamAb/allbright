/**
 * Bridge types for Rust-originating data structures.
 * These map Rust types to their JavaScript runtime representations.
 */

// Rust u64 atomic → JS number (safe for values < 2^53)
export type AtomicU64 = number;

// Rust i64 signed integer → JS number (safe for values < 2^53)
export type i64 = number;

// Mutex-protected container → JS array with mutex metadata placeholder
// At runtime, this is just a standard array; mutex is enforced by Rust side
export type Mutex<T> = T & { __mutex__?: symbol };

// VecDeque<R> → JS array (FIFO queue semantics preserved in JS)
export type VecDeque<T> = T[];
