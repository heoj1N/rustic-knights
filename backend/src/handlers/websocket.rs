// src/handlers/websocket.rs
use actix::{Actor, StreamHandler};
use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct GameMove {
    from: String,
    to: String,
    piece: String,
}

pub struct GameWebSocket {
    game_id: String,
    player_id: String,
}

impl Actor for GameWebSocket {
    type Context = ws::WebsocketContext<Self>;
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for GameWebSocket {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Text(text)) => {
                if let Ok(game_move) = serde_json::from_str::<GameMove>(&text) {
                    ctx.text(serde_json::to_string(&game_move).unwrap());
                }
            }
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Close(reason)) => ctx.close(reason),
            _ => (),
        }
    }
}

// Handle WebSocket connections
pub async fn game_ws(
    req: HttpRequest,
    stream: web::Payload,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let game_id = path.into_inner();
    
    // Extract player_id from headers or query parameters
    // For now, using a dummy player_id for simplicity
    let player_id = "player_123".to_string();
    
    let ws = GameWebSocket {
        game_id,
        player_id,
    };
    
    ws::start(ws, &req, stream)
}