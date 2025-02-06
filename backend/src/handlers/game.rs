// src/handlers/game.rs
use actix_web::{post, web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use crate::models::game_session::GameSession;

#[derive(Deserialize)]
pub struct CreateGameRequest {
    player_id: String,
    game_type: String,
}

#[derive(Serialize)]
pub struct GameResponse {
    game_id: String,
    white_player: String,
    black_player: Option<String>,
}

#[post("/game/create")]
pub async fn create_game(
    db: web::Data<DbConnection>,
    game_req: web::Json<CreateGameRequest>,
) -> Result<HttpResponse> {
    let game = GameSession::new(game_req.player_id.clone());
    let game_id = db.create_game(game).await?;
    
    Ok(HttpResponse::Created().json(GameResponse {
        game_id,
        white_player: game_req.player_id.clone(),
        black_player: None,
    }))
}

#[post("/game/{game_id}/join")]
pub async fn join_game(
    db: web::Data<DbConnection>,
    game_id: web::Path<String>,
    player_id: web::Json<String>,
) -> Result<HttpResponse> {
    let game = db.join_game(&game_id, player_id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(game))
}