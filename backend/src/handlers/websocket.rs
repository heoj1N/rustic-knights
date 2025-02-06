// src/handlers/websocket.rs
use actix::{Actor, StreamHandler};
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
                // Handle game moves and state updates
                if let Ok(game_move) = serde_json::from_str::<GameMove>(&text) {
                    // Validate and broadcast move to other player
                    ctx.text(serde_json::to_string(&game_move).unwrap());
                }
            }
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Close(reason)) => ctx.close(reason),
            _ => (),
        }
    }
}