pub mod models;
pub mod training;
pub mod inference;

use std::error::Error;
use serde::{Serialize, Deserialize};

/// Represents a chess position evaluation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evaluation {
    /// Score from -1.0 (Black winning) to 1.0 (White winning).
    pub score: f32,
    /// Number of positions evaluated.
    pub positions_evaluated: u32,
    /// Time spent thinking in milliseconds.
    pub thinking_time_ms: u64,
}

/// Difficulty level for AI opponents.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Difficulty {
    Low,
    Medium,
    High,
    Custom,
}

/// Configuration for AI behavior.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub difficulty: Difficulty,
    pub max_thinking_time_ms: u64,
    pub max_depth: u8,
}

/// Result type for AI operations.
pub type AIResult<T> = Result<T, Box<dyn Error + Send + Sync>>; 