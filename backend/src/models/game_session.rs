// src/models/game_session.rs
use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;

#[derive(Serialize, Deserialize, Clone)]
pub struct GameSession {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub white_player: String,
    pub black_player: Option<String>,
    pub moves: Vec<String>,
    pub status: GameStatus,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum GameStatus {
    Waiting,
    InProgress,
    Completed,
}

impl GameSession {
    pub fn new(player_id: String) -> Self {
        Self {
            id: None,
            white_player: player_id,
            black_player: None,
            moves: Vec::new(),
            status: GameStatus::Waiting,
        }
    }
}