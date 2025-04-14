pub mod reinforcement;
pub mod traditional;

use crate::ai::{AIConfig, AIResult, Evaluation};

/// Represents a chess position in FEN notation.
pub type Position = String;

/// Represents a chess move in UCI notation (e.g., "e2e4").
pub type Move = String;

/// Base trait for all AI chess models.
#[async_trait::async_trait]
pub trait ChessModel: Send + Sync {
    /// Initialize the model with given configuration.
    async fn init(&mut self, config: AIConfig) -> AIResult<()>;
    
    /// Get the best move for the current position.
    async fn get_best_move(&self, position: &Position) -> AIResult<(Move, Evaluation)>;
    
    /// Update the model's internal state (if any) after a move is played.
    async fn update_state(&mut self, position: &Position) -> AIResult<()>;
    
    /// Get the model's name and version.
    fn get_model_info(&self) -> (&str, &str);
} 